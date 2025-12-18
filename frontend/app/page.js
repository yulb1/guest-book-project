"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [posts, setPosts] = useState([]); // 게시글 목록
  const [content, setContent] = useState(""); // 입력한 내용
  const [author, setAuthor] = useState(""); // 입력한 작성자

  // 1. 게시글 목록 불러오기 (Read)
  useEffect(() => {
    fetch("http://15.164.232.113:8080/api/guestbooks")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("데이터 로드 실패:", err));
  }, []);

  // 2. 게시글 등록하기 (Create)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content || !author) {
      alert("작성자와 내용을 모두 입력해주세요!");
      return;
    }

    try {
      const res = await fetch("http://15.164.232.113:8080/api/guestbooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, author }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts([...posts, newPost]);
        setContent("");
      }
    } catch (err) {
      console.error("등록 실패:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10 text-gray-800">
          나의 개발 다짐
        </h1>

        {/* 입력 폼 */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="작성자"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="border border-gray-300 p-2 rounded w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                placeholder="오늘의 다짐을 적어보세요!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="border border-gray-300 p-2 rounded w-3/4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors font-bold"
            >
              다짐 등록하기
            </button>
          </form>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500">
              아직 등록된 다짐이 없습니다. 첫 번째 다짐을 남겨보세요!
            </p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="text-lg text-gray-800 mb-1">{post.content}</p>
                  <div className="text-sm text-gray-500 flex gap-2">
                    <span className="font-semibold text-blue-600">
                      {post.author}
                    </span>
                    <span>|</span>
                    {/* 작성일자 표시 */}
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
