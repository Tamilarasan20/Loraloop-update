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
  { id: "1", name: "You", email: "you@scalesoci.ai", role: "Admin", avatar: "🧑‍💻", lastActive: "Just now" },
  { id: "2", name: "Sarah Chen", email: "sarah@scalesoci.ai", role: "Editor", avatar: "👩‍🎨", lastActive: "2h ago" },
  { id: "3", name: "Mike Johnson", email: "mike@scalesoci.ai", role: "Editor", avatar: "👨‍💼", lastActive: "1d ago" },
  { id: "4", name: "Lisa Park", email: "lisa@scalesoci.ai", role: "Viewer", avatar: "👩‍🔬", lastActive: "3d ago" },
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-[14px] font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <h1 className="text-[20px] font-bold tracking-tight">Team Management</h1>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 bg-lime-400 text-white px-6 py-2.5 rounded-full font-bold text-[13px] hover:bg-lime-500 transition-all shadow-md active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-10">
        {/* Invite Section */}
        {showInvite && (
          <div className="bg-white border border-lime-200 rounded-[24px] p-8 animate-in slide-in-from-top-4 duration-300 shadow-xl shadow-lime-50/50">
            <h3 className="text-[18px] font-bold mb-6 text-gray-900">Invite a team member</h3>
            <div className="flex gap-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@company.com"
                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-5 py-3.5 text-gray-900 text-[14px] outline-none focus:border-lime-500 font-bold placeholder-gray-400 shadow-inner"
              />
              <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-gray-900 text-[14px] outline-none font-bold shadow-inner cursor-pointer">
                <option>Editor</option>
                <option>Viewer</option>
                <option>Admin</option>
              </select>
              <button className="bg-lime-400 text-white px-8 py-3.5 rounded-xl font-bold text-[14px] hover:bg-lime-500 transition-all shadow-md active:scale-95">
                Send Invite
              </button>
            </div>
          </div>
        )}

        {/* Team Members */}
        <div>
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-6">
            Members ({members.length})
          </h3>
          <div className="flex flex-col gap-3.5">
            {members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role] || Shield;
              return (
                <div
                  key={member.id}
                  className="bg-white border border-gray-200 rounded-[20px] p-6 flex items-center gap-5 hover:border-lime-300 transition-all shadow-sm group hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[24px] shadow-inner border border-gray-100">
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[16px] font-bold text-gray-900">
                        {member.name}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                        member.role === "Admin"
                          ? "bg-lime-50 text-lime-600 border border-lime-100"
                          : member.role === "Editor"
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "bg-gray-50 text-gray-400 border border-gray-100"
                      }`}>
                        <RoleIcon className="w-3 h-3" />
                        {member.role}
                      </span>
                    </div>
                    <span className="text-[13px] text-gray-400 font-bold mt-1 block tracking-tight">{member.email}</span>
                  </div>
                  <span className="text-[12px] text-gray-300 font-bold uppercase tracking-widest">
                    {member.lastActive}
                  </span>
                  <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all group-hover:scale-110">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Approval Queue */}
        <div>
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-lime-500" />
            Pending Approvals ({pendingPosts.filter(p => p.status === "pending").length})
          </h3>
          <div className="flex flex-col gap-4">
            {pendingPosts.map((post) => (
              <div
                key={post.id}
                className={`bg-white border rounded-[24px] p-8 transition-all shadow-sm ${
                  post.status === "approved"
                    ? "border-green-200 opacity-60 bg-green-50/10"
                    : post.status === "rejected"
                    ? "border-red-200 opacity-60 bg-red-50/10"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[16px] font-bold text-gray-900">
                      {post.author}
                    </span>
                    <span className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">
                      {post.submittedAt} · {post.platform}
                    </span>
                  </div>
                  {post.status !== "pending" && (
                    <span className={`text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-widest border ${
                      post.status === "approved"
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}>
                      {post.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                    </span>
                  )}
                </div>
                <p className="text-[15px] text-gray-500 mb-6 font-bold leading-relaxed">
                  {post.content}
                </p>
                {post.status === "pending" && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(post.id)}
                      className="flex items-center gap-2 bg-green-50 text-green-600 border border-green-100 px-6 py-2.5 rounded-xl text-[13px] font-bold hover:bg-green-100 transition-all shadow-sm active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(post.id)}
                      className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-6 py-2.5 rounded-xl text-[13px] font-bold hover:bg-red-100 transition-all shadow-sm active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-gray-900 px-4 py-2.5 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-all uppercase tracking-wider">
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
