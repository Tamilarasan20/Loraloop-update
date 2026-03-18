"use client";

import { useState } from "react";
import { ArrowLeft, Plus, UserPlus, Shield, Crown, MoreHorizontal, CheckCircle, XCircle, Clock, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  avatar: string;
  lastActive: string;
}

interface PendingPost {
  id: string;
  author: string;
  content: string;
  platform: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

const MEMBERS: Member[] = [
  { id: "1", name: "You", email: "you@growloop.ai", role: "Admin", avatar: "🧑‍💻", lastActive: "Just now" },
  { id: "2", name: "Sarah Chen", email: "sarah@growloop.ai", role: "Editor", avatar: "👩‍🎨", lastActive: "2h ago" },
  { id: "3", name: "Mike Johnson", email: "mike@growloop.ai", role: "Editor", avatar: "👨‍💼", lastActive: "1d ago" },
  { id: "4", name: "Lisa Park", email: "lisa@growloop.ai", role: "Viewer", avatar: "👩‍🔬", lastActive: "3d ago" },
];

const PENDING_POSTS: PendingPost[] = [
  { id: "1", author: "Sarah Chen", content: "Exciting news! We're launching our new feature...", platform: "x", status: "pending", submittedAt: "2h ago" },
  { id: "2", author: "Mike Johnson", content: "5 ways AI is transforming marketing in 2026", platform: "linkedin", status: "pending", submittedAt: "5h ago" },
];

const ROLE_ICONS: Record<string, React.ElementType> = {
  Admin: Crown,
  Editor: Shield,
  Viewer: Shield,
};

export default function TeamPage() {
  const [members] = useState(MEMBERS);
  const [pendingPosts, setPendingPosts] = useState(PENDING_POSTS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const handleApprove = (postId: string) => {
    setPendingPosts(prev => prev.map(p => p.id === postId ? { ...p, status: "approved" as const } : p));
  };

  const handleReject = (postId: string) => {
    setPendingPosts(prev => prev.map(p => p.id === postId ? { ...p, status: "rejected" as const } : p));
  };

  return (
    <div className="min-h-screen bg-[#1B1B1B] text-[#EAEAEA]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-[#9A9A9C] hover:text-[#EAEAEA] transition-colors text-[14px] font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <h1 className="text-[20px] font-medium">Team</h1>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 bg-[#C1CD7D] text-[#1B1B1B] px-5 py-2.5 rounded-full font-semibold text-[13px] hover:bg-[#D4E08F] transition-colors shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Invite Section */}
        {showInvite && (
          <div className="bg-[#2C2D2E] border border-[#C1CD7D]/30 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-[15px] font-medium mb-4">Invite a team member</h3>
            <div className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@company.com"
                className="flex-1 bg-[#1B1B1B] border border-transparent rounded-xl px-4 py-3 text-[#EAEAEA] text-[14px] outline-none focus:border-[#4A4B4D] font-medium placeholder-[#525355]"
              />
              <select className="bg-[#1B1B1B] border border-transparent rounded-xl px-4 py-3 text-[#EAEAEA] text-[14px] outline-none font-medium">
                <option>Editor</option>
                <option>Viewer</option>
                <option>Admin</option>
              </select>
              <button className="bg-[#C1CD7D] text-[#1B1B1B] px-6 py-3 rounded-xl font-semibold text-[14px] hover:bg-[#D4E08F] transition-colors">
                Send Invite
              </button>
            </div>
          </div>
        )}

        {/* Team Members */}
        <div>
          <h3 className="text-[15px] font-medium text-[#EAEAEA] mb-4">
            Members ({members.length})
          </h3>
          <div className="flex flex-col gap-3">
            {members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role] || Shield;
              return (
                <div
                  key={member.id}
                  className="bg-[#2C2D2E] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-[#363738] flex items-center justify-center text-[20px]">
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#EAEAEA]">
                        {member.name}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        member.role === "Admin"
                          ? "bg-[#C1CD7D]/15 text-[#C1CD7D]"
                          : member.role === "Editor"
                          ? "bg-blue-400/15 text-blue-400"
                          : "bg-white/5 text-[#9A9A9C]"
                      }`}>
                        <RoleIcon className="w-3 h-3" />
                        {member.role}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#9A9A9C]">{member.email}</span>
                  </div>
                  <span className="text-[12px] text-[#525355] font-medium">
                    {member.lastActive}
                  </span>
                  <button className="p-2 rounded-lg hover:bg-white/5 text-[#9A9A9C]">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Approval Queue */}
        <div>
          <h3 className="text-[15px] font-medium text-[#EAEAEA] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C1CD7D]" />
            Pending Approvals ({pendingPosts.filter(p => p.status === "pending").length})
          </h3>
          <div className="flex flex-col gap-3">
            {pendingPosts.map((post) => (
              <div
                key={post.id}
                className={`bg-[#2C2D2E] border rounded-2xl p-5 transition-all ${
                  post.status === "approved"
                    ? "border-green-500/30 opacity-70"
                    : post.status === "rejected"
                    ? "border-red-500/30 opacity-70"
                    : "border-white/5"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[13px] font-medium text-[#EAEAEA]">
                      {post.author}
                    </span>
                    <span className="text-[12px] text-[#9A9A9C] ml-2">
                      · {post.submittedAt} · {post.platform}
                    </span>
                  </div>
                  {post.status !== "pending" && (
                    <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                      post.status === "approved"
                        ? "bg-green-400/15 text-green-400"
                        : "bg-red-400/15 text-red-400"
                    }`}>
                      {post.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                    </span>
                  )}
                </div>
                <p className="text-[14px] text-[#9A9A9C] mb-4 font-medium">
                  {post.content}
                </p>
                {post.status === "pending" && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(post.id)}
                      className="flex items-center gap-1.5 bg-green-500/15 text-green-400 px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-green-500/25 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(post.id)}
                      className="flex items-center gap-1.5 bg-red-500/15 text-red-400 px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-red-500/25 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button className="flex items-center gap-1.5 text-[#9A9A9C] hover:text-[#EAEAEA] px-3 py-2 rounded-xl text-[13px] font-medium hover:bg-white/5 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      Comment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
