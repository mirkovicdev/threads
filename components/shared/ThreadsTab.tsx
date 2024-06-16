import React from 'react';
import { fetchUserPosts } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';
import ThreadCard from '../cards/ThreadCard';

interface Props {
  currentUserId: string,
  accountId: string,
  accountType?: string
}

// Fetch profile threads
const ThreadsTab = async ({ currentUserId, accountId, accountType }: Props) => {
  let result;
  try {
    result = await fetchUserPosts(accountId);
    console.log('Fetched user posts result:', result);
  } catch (error) {
    console.error('Failed to fetch user posts', error);
    return redirect('/');
  }

  if (!result || !Array.isArray(result.posts)) {
    console.log('Invalid result or posts array:', result);
    return redirect('/');
  }

  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.posts.map((thread: any) => (
        <ThreadCard
          key={thread._id}
          id={thread._id}
          currentUserId={currentUserId}
          parentId={thread.parentId}
          content={thread.text}
          author={accountType === 'User'
            ? { name: result.name, image: result.image, id: result.id }
            : { name: thread.author.name, image: thread.author.image, id: thread.author.id }
          }
          community={thread.community}
          createdAt={thread.createdAt}
          comments={thread.children}
        />
      ))}
    </section>
  );
};

export default ThreadsTab;