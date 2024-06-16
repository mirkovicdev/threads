"use server"

import User from "../models/user.model";
import Thread from "../models/thread.model";
import { connectToDB } from "../mongoose";
import { revalidatePath } from "next/cache";
import { connect } from "http2";
import { model } from "mongoose";

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,

}

export async function createThread({
    author, text, communityId, path
}: Params) {
    try {
        connectToDB();

        const createdThread = await Thread.create({
            text,
            author,
            community: null,
        });

        //Update user model
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id }
        });

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Error creating thread: ${error.message}`);
    }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    try {
        connectToDB();

        // Calculate the numbers of posts to skip based on the page number
        const skipAmount = pageSize * (pageNumber - 1);

        // Fetch posts that have no parents ( top level posts )
        const postsQuery = Thread.find({
            parentId: { $in: [null, undefined]}})
            .sort({createdAt: 'desc'})
            .skip(skipAmount)
            .limit(pageSize)
            .populate({ path: 'author', model: User})
            .populate({
                path: 'children',
                populate: {
                    path: 'author',
                    model: User,
                    select: "_id name parentId image"
                }
            })

            const totalPostsCount = await Thread.countDocuments({
                parentId: { $in: [null, undefined]}
            });

            const posts = await postsQuery.exec();

            const isNext = totalPostsCount > skipAmount + posts.length;

            return { posts, isNext };
    } catch (error: any) {
        throw new Error(`Error fetching posts: ${error.message}`);
    }
}

export async function fetchThreadById(id: string) {
    connectToDB();
    try {
        //TODO populate community
        const thread = await Thread.findById(id)
        .populate({
            path: 'author',
            model: User,
            select: "_id id name image"
        })
        .populate({
            path: 'children',
            populate: [
                {
                    path: 'author',
                    model: User,
                    select: "_id id name parentId image"
                },
                {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: "_id id name parentId image"
                    }
                }
            ]
        }).exec();

        return thread;
    } catch (error: any) {
        throw new Error(`Error fetching thread: ${error.message}`);
    }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
) {
    connectToDB();
    try {
        //adding a comment
        //Find original thread by id
        const originalThread = await Thread.findById(threadId);
        if(!originalThread) {
            throw new Error('Thread not found');
        }

        //create new thread with comment text
        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,
        })

        //save new thread
        const savedCommentThread = await commentThread.save();

        //update original thread to include comment
        originalThread.children.push(savedCommentThread._id);

        //save original thread
        await originalThread.save();

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Error adding comment to thread: ${error.message}`);
    }
}