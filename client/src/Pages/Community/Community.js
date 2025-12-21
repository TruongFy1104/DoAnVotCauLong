// Community.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";

import "../../Css/Community.css";
import UserList from "./UserList";
import Feed from "./Feed";
import ChatBox from "./ChatBox";

const socket = io("http://localhost:3000");

export default function Community() {
  const [users, setUsers] = useState([]);
  const [usersWithMessages, setUsersWithMessages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postFilterType, setPostFilterType] = useState("content"); // content hoặc author
  const [searchQuery, setSearchQuery] = useState("");
  const [chatTarget, setChatTarget] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Dùng useRef để lưu giá trị mới nhất của currentUser và chatTarget
  const currentUserRef = useRef(null);
  const chatTargetRef = useRef(null);

  // Cập nhật ref mỗi khi state thay đổi
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    chatTargetRef.current = chatTarget;
  }, [chatTarget]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        setCurrentUser(JSON.parse(userRaw));
      } catch (e) {
        console.error("Không parse được user:", e);
      }
    }
  }, []);

  // Lọc bài viết theo từ khóa
  useEffect(() => {
    if (!postSearchQuery.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const query = postSearchQuery.toLowerCase().trim();
    let filtered = posts;

    if (postFilterType === "author") {
      // Lọc theo tên người đăng
      filtered = posts.filter(post => {
        const authorName = post.author?.name || "";
        return authorName.toLowerCase().includes(query);
      });
      
      console.log(`Tìm "${query}" theo tên người đăng, tìm thấy: ${filtered.length} bài viết`);
    } else {
      // Lọc theo nội dung bài viết
      filtered = posts.filter(post => {
        const content = post.Content || post.content || "";
        return content.toLowerCase().includes(query);
      });
    }

    setFilteredPosts(filtered);
  }, [postSearchQuery, postFilterType, posts]);

  // Thêm hàm fetch lại danh sách bài viết
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const postsRes = await axios.get("http://localhost:3000/post/feed", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(postsRes.data);
    } catch (err) {
      console.error("Lỗi khi fetch bài viết:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const usersRes = await axios.get("http://localhost:3000/chat/users", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        console.log("Tất cả users từ API:", usersRes.data);

        // Lấy cả người dùng (IdGroup = 2) và nhân viên (IdGroup = 3)
        const filteredUsers = usersRes.data.filter((user) => user.IdGroup === 2 || user.IdGroup === 3);

        console.log("Users sau khi filter (IdGroup 2 hoặc 3):", filteredUsers);

        const mappedUsers = filteredUsers.map((user) => ({
            ...user,
            id: user.AccountId,
            name:
              user.Firstname && user.Lastname
                ? `${user.Firstname} ${user.Lastname}`
                : user.Username,
            avatar:
              user.Avatar ||
              "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(user.Username),
            isStaff: user.IdGroup === 3, // Đánh dấu nhân viên
          }));

        // Sắp xếp: Nhân viên lên đầu
        const sortedUsers = mappedUsers.sort((a, b) => {
          if (a.isStaff && !b.isStaff) return -1;
          if (!a.isStaff && b.isStaff) return 1;
          return 0;
        });

        console.log("Users sau khi sort (nhân viên lên đầu):", sortedUsers);

        setUsers(sortedUsers);

        // Sử dụng fetchPosts để lấy bài viết
        await fetchPosts();
        
        // Lấy tin nhắn cuối cùng cho mỗi người dùng
        if (currentUser) {
          await fetchLastMessages(sortedUsers);
        }
      } catch (err) {
        console.error("Lỗi khi fetch dữ liệu:", err);
      }
      setLoading(false);
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Hàm lấy tin nhắn cuối cùng cho mỗi người dùng
  const fetchLastMessages = async (usersList) => {
    if (!currentUser) return;
    
    try {
      const usersWithMessagesData = await Promise.all(
        usersList.map(async (user) => {
          try {
            const response = await axios.get("http://localhost:3000/chat/messages", {
              params: { SenderId: currentUser.id, ReceiverId: user.id },
            });
            const messages = response.data;
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            
            // Tìm tin nhắn cuối cùng từ current user gửi cho user này
            const lastSentMessage = messages
              .filter(msg => msg.SenderId === currentUser.id && msg.ReceiverId === user.id)
              .pop();
            
            // Chỉ đếm tin nhắn từ user GỬI ĐẾN sau tin nhắn cuối current user đã gửi
            let unreadCount = 0;
            if (lastSentMessage) {
              const lastSentTime = new Date(lastSentMessage.SentAt);
              unreadCount = messages.filter(
                msg => msg.SenderId === user.id && 
                       msg.ReceiverId === currentUser.id &&
                       new Date(msg.SentAt) > lastSentTime
              ).length;
            } else {
              // Nếu chưa có tin nhắn nào từ current user, đếm tất cả tin từ user
              unreadCount = messages.filter(
                msg => msg.SenderId === user.id && msg.ReceiverId === currentUser.id
              ).length;
            }
            
            return {
              ...user,
              lastMessage: lastMessage,
              lastMessageTime: lastMessage ? new Date(lastMessage.SentAt) : null,
              lastMessageIsSentByMe: lastMessage?.SenderId === currentUser.id,
              unreadCount: unreadCount
            };
          } catch (err) {
            return { ...user, lastMessage: null, lastMessageTime: null, unreadCount: 0 };
          }
        })
      );

      // Sắp xếp theo tin nhắn mới nhất
      const sorted = usersWithMessagesData.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime - a.lastMessageTime;
      });

      setUsersWithMessages(sorted);
    } catch (err) {
      console.error("Lỗi khi fetch tin nhắn cuối:", err);
    }
  };

  // Refresh danh sách khi có tin nhắn mới
  useEffect(() => {
    if (currentUser && users.length > 0) {
      fetchLastMessages(users);
    }
  }, [chatMessages]);

  useEffect(() => {
    const handleReceiveMessage = (message) => {
      console.log("SOCKET RECEIVE:", message);
      // Sử dụng ref để lấy giá trị mới nhất
      const currentUserId = currentUserRef.current?.id;
      const chatTargetId = chatTargetRef.current?.id;
      
      if (
        (message.SenderId === currentUserId && message.ReceiverId === chatTargetId) ||
        (message.SenderId === chatTargetId && message.ReceiverId === currentUserId)
      ) {
        setChatMessages((prev) => [...prev, message]);
      }
    };

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("disconnect", () => console.log("Socket disconnected"));
    
    return () => {
      socket.off("connect");
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("disconnect");
    };
  }, []); // Chỉ mount 1 lần duy nhất

  const handleSelectUser = async (user) => {
    if (!isAuthenticated) {
      alert("Bạn cần đăng nhập để sử dụng chức năng này.");
      return;
    }
    setChatTarget(user);
    try {
      const response = await axios.get("http://localhost:3000/chat/messages", {
        params: { SenderId: currentUser.id, ReceiverId: user.id },
      });
      setChatMessages(response.data);
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn:", error);
    }
  };

  const handleCloseChat = () => {
    setChatTarget(null);
    setChatMessages([]);
  };

  // Hàm cập nhật bài viết (sau khi chỉnh sửa)
  const handleUpdatePost = async () => {
    await fetchPosts(); // Luôn lấy lại danh sách bài viết mới nhất
  };

  if (loading)
    return (
      <div className="community-container">
        <p>Đang tải...</p>
      </div>
    );

  return (
    <div className="community-container">
      <h1 className="community-title">Badminton Social Hub</h1>
      <div className="community-layout">
        <UserList
          users={usersWithMessages.length > 0 ? usersWithMessages : users}
          onUserClick={handleSelectUser}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <Feed
          posts={filteredPosts.length > 0 || postSearchQuery ? filteredPosts : posts}
          setPosts={setPosts}
          fetchPosts={fetchPosts}
          postSearchQuery={postSearchQuery}
          setPostSearchQuery={setPostSearchQuery}
          postFilterType={postFilterType}
          setPostFilterType={setPostFilterType}
          onLike={(postId) => console.log("Liked post:", postId)}
          onDelete={(postId) => {
            setPosts(posts.filter(p => p.PostId !== postId));
            fetchPosts();
          }}
          onUpdate={handleUpdatePost} // Truyền hàm cập nhật xuống Feed/Post
        />
        {chatTarget && (
          <ChatBox
            user={chatTarget}
            messages={chatMessages}
            onClose={handleCloseChat}
            currentUser={currentUser}
            setMessages={setChatMessages}
          />
        )}
        {!isAuthenticated && (
          <div className="login-reminder">
            <p>Bạn cần đăng nhập để sử dụng các chức năng.</p>
          </div>
        )}
      </div>
    </div>
  );
}
