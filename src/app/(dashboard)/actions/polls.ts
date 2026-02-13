"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PollOption = {
  id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
  user_voted: boolean;
};

export type Poll = {
  id: string;
  post_id: string;
  question: string;
  multiple_choice: boolean;
  expires_at: string | null;
  created_at: string;
  options: PollOption[];
  total_votes: number;
  user_voted: boolean;
};

export type CreatePollResult =
  | { success: true; pollId: string }
  | { success: false; error: string };

export type VoteResult =
  | { success: true; pollId: string }
  | { success: false; error: string };

export async function createPoll(
  postId: string,
  question: string,
  options: string[],
  multipleChoice: boolean = false,
  expiresAt: string | null = null
): Promise<CreatePollResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Validate inputs
  if (!question?.trim()) return { success: false, error: "Question is required." };
  if (options.length < 2) return { success: false, error: "At least 2 options are required." };
  if (options.length > 10) return { success: false, error: "Maximum 10 options allowed." };

  // Check if post exists and belongs to user
  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .single();

  if (!post) return { success: false, error: "Post not found." };
  if (post.user_id !== user.id) {
    return { success: false, error: "Can only add poll to own post." };
  }

  // Create poll
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      post_id: postId,
      question: question.trim(),
      multiple_choice: multipleChoice,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (pollError) return { success: false, error: pollError.message };

  // Create poll options
  const pollOptions = options.map((option, index) => ({
    poll_id: poll.id,
    option_text: option.trim(),
    option_order: index,
  }));

  const { error: optionsError } = await supabase
    .from("poll_options")
    .insert(pollOptions);

  if (optionsError) {
    // Rollback poll creation
    await supabase.from("polls").delete().eq("id", poll.id);
    return { success: false, error: optionsError.message };
  }

  // Update post media_type
  await supabase
    .from("posts")
    .update({ media_type: "poll" })
    .eq("id", postId);

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, pollId: poll.id };
}

export async function votePoll(
  pollId: string,
  optionIds: string[]
): Promise<VoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Validate inputs
  if (!optionIds.length) return { success: false, error: "At least one option must be selected." };

  // Get poll details
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, multiple_choice, expires_at")
    .eq("id", pollId)
    .single();

  if (pollError) return { success: false, error: pollError.message };
  if (!poll) return { success: false, error: "Poll not found." };

  // Check if poll has expired
  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return { success: false, error: "Poll has expired." };
  }

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingVote) {
    if (poll.multiple_choice) {
      // For multiple choice, check if already voted for specific options
      const { data: existingVotes } = await supabase
        .from("poll_votes")
        .select("option_id")
        .eq("poll_id", pollId)
        .eq("user_id", user.id);

      const existingOptionIds = existingVotes?.map((v) => v.option_id) ?? [];
      const newOptionIds = optionIds.filter((id) => !existingOptionIds.includes(id));

      if (newOptionIds.length === 0) {
        return { success: false, error: "Already voted for these options." };
      }

      // Add new votes
      const { error: voteError } = await supabase
        .from("poll_votes")
        .insert(newOptionIds.map((optionId) => ({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id,
        })));

      if (voteError) return { success: false, error: voteError.message };
    } else {
      return { success: false, error: "Already voted." };
    }
  } else {
    // Single choice poll - only allow one vote
    if (!poll.multiple_choice && optionIds.length > 1) {
      return { success: false, error: "Single choice poll allows only one vote." };
    }

    // Create votes
    const { error: voteError } = await supabase
      .from("poll_votes")
      .insert(optionIds.map((optionId) => ({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      })));

    if (voteError) return { success: false, error: voteError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, pollId };
}

export async function getPollResults(pollId: string, userId: string): Promise<Poll | null> {
  const supabase = await createClient();

  // Get poll details
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, post_id, question, multiple_choice, expires_at, created_at")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) return null;

  // Get poll options
  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .select("id, option_text, option_order")
    .eq("poll_id", pollId)
    .order("option_order", { ascending: true });

  if (optionsError) return null;

  // Get votes for each option
  const optionIds = options?.map((o) => o.id) ?? [];
  const { data: votes } = await supabase
    .from("poll_votes")
    .select("id, option_id, user_id")
    .eq("poll_id", pollId);

  const voteMap = new Map<string, number>();
  const userVotes = votes?.filter((v) => v.user_id === userId).map((v) => v.option_id) ?? [];

  votes?.forEach((vote) => {
    voteMap.set(vote.option_id, (voteMap.get(vote.option_id) ?? 0) + 1);
  });

  const totalVotes = votes?.length ?? 0;

  const pollOptions: PollOption[] =
    options?.map((option) => ({
      id: option.id,
      option_text: option.option_text,
      option_order: option.option_order,
      vote_count: voteMap.get(option.id) ?? 0,
      user_voted: userVotes.includes(option.id),
    })) ?? [];

  return {
    ...poll,
    options: pollOptions,
    total_votes: totalVotes,
    user_voted: userVotes.length > 0,
  };
}

export async function getPollByPostId(postId: string, userId: string): Promise<Poll | null> {
  const supabase = await createClient();

  const { data: poll } = await supabase
    .from("polls")
    .select("id")
    .eq("post_id", postId)
    .single();

  if (!poll) return null;

  return getPollResults(poll.id, userId);
}
