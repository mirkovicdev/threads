"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";
import { skip } from "node:test";

interface Params {
    userId: string,
    username: string,
    name: string,
    image: string,
    bio: string,
    path: string
}

export async function updateUser({    
    userId,
    username,
    name,
    image,
    bio,
    path,
}: Params): Promise<void> {
    connectToDB();

    try {
        await User.findOneAndUpdate(
            { id: userId },
            { 
                username: username.toLowerCase(),
                name,
                image,
                bio,
                onboarded: true,
            },
            { upsert: true }
        );
    
        if(path === '/profile/edit') {
            revalidatePath(path);
        }
    } catch (error: any) {
        throw new Error(`Error updating user: ${error.message}`);
    }
}

export async function fetchUser(userId: string) {
    try {
        connectToDB();
        return await User
            .findOne({ id: userId })
            // .populate({
            //     path: 'communities',
            //     model: 'Community',
            // })
    } catch (error: any) {
        throw new Error(`Error fetching user: ${error.message}`);
    }
}

export async function fetchUserPosts(userId: string) {
    try {
      await connectToDB();
  
      const user = await User.findOne({ id: userId }).populate({
        path: 'threads',
        model: Thread,
        populate: [
          {
            path: 'children',
            model: Thread,
            populate: {
              path: 'author',
              model: User,
              select: 'name image id',
            },
          },
        ],
      });
  
      if (!user) {
        console.log('No user found for the given userId:', userId);
        return null;
      }
  
      const result = {
        posts: user.threads,
        name: user.name,
        image: user.image,
        id: user.id
      };
  
      console.log('Fetched user threads:', result);
      return result;
    } catch (error) {
      console.error('Error fetching user threads:', error);
      throw error;
    }
  }

export async function fetchUsers({ 
    userId, 
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc"
}: {
    userId: string,
    searchString?: string,
    pageNumber?: number,
    pageSize?: number,
    sortBy?: SortOrder
}) {
    try {
        connectToDB();
        const skipAmount = (pageNumber-1)* pageSize;
        const regex = new RegExp(searchString, 'i')

        const query: FilterQuery<typeof User>= {
            id: { $ne: userId}
        }
        if(searchString.trim() !== '') {
            query.$or = [
                { username: { $regex: regex }},
                { name: { $regex: regex }}
            ]
        }

        const sortOptions = { createdAt: sortBy };
        const usersQuery = User.find(query)
        .sort(sortOptions)
        .skip(skipAmount)
        .limit(pageSize);

        const totalUsersCount = await User.countDocuments(query);

        const users = await usersQuery.exec();

        const isNext = totalUsersCount > skipAmount + users.length;

        return { users, isNext }
    } catch (error: any) {
        throw new Error(`Error fetching users: ${error.message}`);
    }
}

export async function getActivity(userId: string) {
    try {
        connectToDB();

        //find all threads created by the user
        const userThreads = await Thread.find({ author: userId })

        //collect all child thread ids (replies) from the children field
        const childThreadIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.children)
        }, [])

        //find all threads that the user has replied to
        const replies = await Thread.find({
             _id: { $in: childThreadIds },
             author: { $ne: userId }
            }).populate({
                path: 'author',
                model: User,
                select: 'name image _id'
            })
            return replies;

    } catch (error: any) {
        throw new Error(`Error fetching activity: ${error.message}`);
    }
}