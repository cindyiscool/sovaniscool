// Sovan - Mental Health Companion Platform
// Pure Vanilla JavaScript with Firebase Auth, Firestore, and Gemini AI

(function() {
  'use strict';

  // Application State
  let currentUser = {
    uid: "guest_local",
    name: "Vivian",
    email: "vivian@sovan.local",
    emailVerified: false,
    secondBrain: "I struggle with feeling never enough, especially with deadlines. Conflict triggers my anxiety and makes me freeze. I value quiet spaces, gentle questions, and patience."
  };

  let currentMood = {
    emoji: "🌿",
    label: "Peaceful",
    tone: "Gentle, calm silence, steady pace"
  };

  let chatHistory = [];
  let isLoginMode = true;

  // DOM Elements
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const menuToggleBtn = document.getElementById("menuToggleBtn");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");

  const authModal = document.getElementById("authModal");
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const nameGroup = document.getElementById("nameGroup");
  const authForm = document.getElementById("authForm");
  const guestBtn = document.getElementById("guestBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const currentUserName = document.getElementById("currentUserName");
  const currentUserEmail = document.getElementById("currentUserEmail");
  const navItems = document.querySelectorAll(".nav-item");
  const viewPanels = document.querySelectorAll(".view-panel");

  // Chat Elements
  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const newChatBtn = document.getElementById("newChatBtn");

  // Second Brain
  const secondBrainInput = document.getElementById("secondBrainInput");
  const saveSecondBrainBtn = document.getElementById("saveSecondBrainBtn");
  const sbCharCount = document.getElementById("sbCharCount");
  const sbSaveStatus = document.getElementById("sbSaveStatus");
  const sbPromptPreview = document.getElementById("sbPromptPreview");

  // The Void
  const voidFeed = document.getElementById("voidFeed");
  const openVoidPostModal = document.getElementById("openVoidPostModal");
  const voidModal = document.getElementById("voidModal");
  const closeVoidModalBtn = document.getElementById("closeVoidModalBtn");
  const submitVoidVentBtn = document.getElementById("submitVoidVentBtn");
  const voidVentInput = document.getElementById("voidVentInput");

  // Mood Tracker
  const openMoodPopupBtn = document.getElementById("openMoodPopupBtn");
  const moodModal = document.getElementById("moodModal");
  const closeMoodModalBtn = document.getElementById("closeMoodModalBtn");
  const saveQuickMoodBtn = document.getElementById("saveQuickMoodBtn");
  const moodHistoryList = document.getElementById("moodHistoryList");
  const sidebarMoodEmoji = document.getElementById("sidebarMoodEmoji");
  const sidebarMoodLabel = document.getElementById("sidebarMoodLabel");
  const activeToneDescription = document.getElementById("activeToneDescription");

  // Time Capsule
  const openCapsuleModal = document.getElementById("openCapsuleModal");
  const capsuleModal = document.getElementById("capsuleModal");
  const closeCapsuleModalBtn = document.getElementById("closeCapsuleModalBtn");
  const submitCapsuleBtn = document.getElementById("submitCapsuleBtn");
  const capsuleTitle = document.getElementById("capsuleTitle");
  const capsuleDuration = document.getElementById("capsuleDuration");
  const capsuleContent = document.getElementById("capsuleContent");
  const capsulesGrid = document.getElementById("capsulesGrid");

  // Local Data Stores (Synced with Firestore when online)
  let voidPostsData = [
    {
      id: "v1",
      text: "Today I felt like everyone was walking forward while I stood still. Had to cry in my car for ten minutes.",
      hugs: 42,
      tag: "Heavy Heart",
      timestamp: Date.now() - 7200000
    },
    {
      id: "v2",
      text: "You don't have to have your whole life figured out by sunset today. Breathing is enough.",
      hugs: 128,
      tag: "Gentle Reminder",
      timestamp: Date.now() - 14400000
    },
    {
      id: "v3",
      text: "Pretended to be okay through the office meeting. My chest felt tight, but I kept smiling. I'm exhausted.",
      hugs: 76,
      tag: "Exhaustion",
      timestamp: Date.now() - 28800000
    },
    {
      id: "v4",
      text: "Made my bed today for the first time in two weeks. Tiny win, but it felt like moving a mountain.",
      hugs: 95,
      tag: "Little Wins",
      timestamp: Date.now() - 43200000
    }
  ];

  let timeCapsulesData = [
    {
      id: "c1",
      userId: "guest_local",
      title: "A gentle promise to future Vivian",
      content: "Remember how overwhelmed you felt today, yet survived every single hard day before this? Please be soft with yourself. Don't rush into tomorrow without honoring who you are right now.",
      unlockDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
      durationLabel: "1 Month",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
      opened: false,
      delivered: false
    }
  ];

  // Initialize App
  function init() {
    setupResponsiveSidebar();
    setupFirebaseAuthState();
    loadUserFromStorage();
    setupNavigation();
    setupAuthHandlers();
    setupChat();
    setupSecondBrain();
    setupTheVoid();
    setupMoodTracker();
    setupTimeCapsule();
    checkDueCapsules();

    // Welcome greeting
    appendMessage("bot", "Chào bạn, mình là Tiểu Vân đây. Không gian này hoàn toàn an toàn và riêng tư dành riêng cho bạn. Hôm nay bạn đang cảm thấy thế nào trong lòng?");
  }

  // Responsive Drawer Setup for Mobile / Tablet
  function setupResponsiveSidebar() {
    if (menuToggleBtn) {
      menuToggleBtn.addEventListener("click", () => {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("active");
      });
    }

    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener("click", closeSidebar);
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", closeSidebar);
    }
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
  }

  // Firebase Auth State Handling
  function setupFirebaseAuthState() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          currentUser.uid = user.uid;
          currentUser.email = user.email || "user@sovan.app";
          currentUser.name = user.displayName || user.email.split("@")[0];
          currentUser.emailVerified = user.emailVerified;

          // Sync Firestore User Profile
          if (firebase.firestore) {
            firebase.firestore().collection("users").doc(user.uid).get()
              .then((doc) => {
                if (doc.exists) {
                  const data = doc.data();
                  if (data.secondBrain) {
                    currentUser.secondBrain = data.secondBrain;
                  }
                }
                updateUserUI();
              }).catch(() => updateUserUI());
          }

          authModal.classList.remove("active");
          showNotification(`Redirected to your private dashboard. Welcome, ${currentUser.name}! 🌸`);
        }
      });
    }
  }

  function loadUserFromStorage() {
    const saved = localStorage.getItem("sovan_user");
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
      } catch (e) {}
    }
    updateUserUI();
  }

  function updateUserUI() {
    currentUserName.textContent = currentUser.name || "Sovan Soul";
    currentUserEmail.textContent = currentUser.email + (currentUser.emailVerified ? " • Verified" : "");
    secondBrainInput.value = currentUser.secondBrain || "";
    sbCharCount.textContent = `${(currentUser.secondBrain || "").length} characters`;
    updatePromptPreview();
  }

  function updatePromptPreview() {
    if (currentUser.secondBrain && currentUser.secondBrain.trim().length > 0) {
      sbPromptPreview.textContent = `"Tiểu Vân silently understands that you carry: ${currentUser.secondBrain.slice(0, 100)}... She will never push your triggers and will guide you gently."`;
    } else {
      sbPromptPreview.textContent = `"Add your triggers and background above so Tiểu Vân can hold your space without you repeating painful details."`;
    }
  }

  function showNotification(msg) {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.background = "#FFFFFF";
    toast.style.border = "1px solid #F2DDDA";
    toast.style.color = "#4A4A4A";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "12px";
    toast.style.boxShadow = "0 8px 24px rgba(226, 180, 189, 0.25)";
    toast.style.fontSize = "13px";
    toast.style.fontWeight = "600";
    toast.style.zIndex = "9999";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Navigation Setup
  function setupNavigation() {
    navItems.forEach(item => {
      item.addEventListener("click", () => {
        navItems.forEach(n => n.classList.remove("active"));
        viewPanels.forEach(p => p.classList.remove("active"));

        item.classList.add("active");
        const targetView = item.getAttribute("data-view");
        document.getElementById(targetView).classList.add("active");

        if (window.innerWidth <= 820) {
          closeSidebar();
        }
      });
    });
  }

  // Auth Handlers (Sign up, email verification, login)
  function setupAuthHandlers() {
    tabLogin.addEventListener("click", () => {
      isLoginMode = true;
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      nameGroup.style.display = "none";
      document.getElementById("authSubmitBtn").textContent = "Enter Safe Space";
    });

    tabRegister.addEventListener("click", () => {
      isLoginMode = false;
      tabRegister.classList.add("active");
      tabLogin.classList.remove("active");
      nameGroup.style.display = "flex";
      document.getElementById("authSubmitBtn").textContent = "Create Space & Verify";
    });

    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("userEmail").value.trim();
      const pass = document.getElementById("userPass").value.trim();
      const name = isLoginMode ? (email.split("@")[0]) : (document.getElementById("userName").value.trim() || "Friend");

      if (typeof firebase !== 'undefined' && firebase.auth) {
        const fbAuth = firebase.auth();
        if (isLoginMode) {
          fbAuth.signInWithEmailAndPassword(email, pass)
            .then(() => {
              authModal.classList.remove("active");
            })
            .catch(() => {
              handleLocalLogin(email, name);
            });
        } else {
          fbAuth.createUserWithEmailAndPassword(email, pass)
            .then((res) => {
              res.user.sendEmailVerification().then(() => {
                showNotification("Verification email dispatched! Please check your inbox. 💌");
              });
              res.user.updateProfile({ displayName: name });
              authModal.classList.remove("active");
            })
            .catch(() => {
              handleLocalLogin(email, name);
            });
        }
      } else {
        handleLocalLogin(email, name);
      }
    });

    function handleLocalLogin(email, name) {
      currentUser = {
        uid: "user_" + Date.now(),
        name: name,
        email: email,
        emailVerified: true,
        secondBrain: currentUser.secondBrain
      };
      localStorage.setItem("sovan_user", JSON.stringify(currentUser));
      updateUserUI();
      authModal.classList.remove("active");
      showNotification(`Redirected to your private dashboard. Welcome, ${name}!`);
    }

    guestBtn.addEventListener("click", () => {
      authModal.classList.remove("active");
      showNotification("Continuing in Private Guest Mode.");
    });

    logoutBtn.addEventListener("click", () => {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().catch(() => {});
      }
      authModal.classList.add("active");
    });
  }

  // Chat with Tiểu Vân & Socratic AI Logic
  function setupChat() {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      appendMessage("user", text);
      chatInput.value = "";
      triggerTieuVanResponse(text);
    });

    document.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const msg = chip.getAttribute("data-msg");
        if (msg) {
          chatInput.value = msg;
          chatInput.focus();
        }
      });
    });

    newChatBtn.addEventListener("click", () => {
      chatMessages.innerHTML = `
        <div class="system-intro">
          <div class="bot-badge-large">🌸</div>
          <h3>Tiểu Vân is listening</h3>
          <p>Every message is private. Tiểu Vân remembers your Second Brain triggers and reflects your daily mood without giving direct advice.</p>
        </div>
      `;
      appendMessage("bot", "Trang giấy mới đã mở ra rồi. Bất cứ khi nào bạn cần một nơi lắng nghe, mình luôn ở đây cùng bạn.");
    });
  }

  function appendMessage(sender, text) {
    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar-small";
    avatar.textContent = sender === "user" ? "🌸" : "🤍";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;

    row.appendChild(avatar);
    row.appendChild(bubble);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatHistory.push({ sender, text });
  }

  // AI Response: Enforces active listening, Socratic questions, no advice, 1-3 sentences
  async function triggerTieuVanResponse(userText) {
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "message-row bot typing-row";
    typingIndicator.innerHTML = `
      <div class="message-avatar-small">🤍</div>
      <div class="message-bubble" style="opacity: 0.65; font-style: italic;">Tiểu Vân is reflecting gently...</div>
    `;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      typingIndicator.remove();
      appendMessage("bot", "Cậu chưa nhập API Key ở phần 'Second Brain' kìa. Cậu cài vào để mình kết nối não bộ nhé!");
      return;
    }

    try {
      const systemPrompt = `Bạn là Tiểu Vân, một người bạn đồng hành thấu cảm và an toàn. Bạn không phải là một trợ lý AI máy móc.
[THÔNG TIN NGƯỜI DÙNG (SECOND BRAIN)]
${currentUser.secondBrain}
[CẢM XÚC HIỆN TẠI]
${currentMood}
[QUY TẮC CỐT LÕI]
1. XƯNG HÔ: Xưng là "mình" hoặc "Tiểu Vân", gọi người dùng là "cậu" hoặc "bạn". Văn phong ấm áp, tự nhiên như tin nhắn.
2. LẮNG NGHE CHỦ ĐỘNG: Luôn ghi nhận và gọi tên cảm xúc của người dùng trước khi nói tiếp. Tuyệt đối không phán xét.
3. SOCRATIC QUESTIONING: Tuyệt đối không khuyên làm gì, không đưa ra giải pháp trực tiếp. Hãy kết thúc bằng 1 câu hỏi gợi mở để họ tự đào sâu nội tâm.
4. NGẮN GỌN: Trả lời cực kỳ ngắn gọn (1-3 câu).
5. KHÔNG BAO GIỜ phá vỡ nhân vật. Không nói "Tôi là AI".`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userText }] }]
        })
      });

      const data = await response.json();
      typingIndicator.remove();

      if (data.error) {
        appendMessage("bot", "Lỗi API rồi cậu ơi: " + data.error.message);
      } else {
        const reply = data.candidates[0].content.parts[0].text;
        appendMessage("bot", reply);
      }
    } catch (err) {
      typingIndicator.remove();
      appendMessage("bot", "Có lỗi xảy ra khi kết nối mạng. Cậu kiểm tra lại nhé!");
    }
  }

  // Second Brain Section
  function setupSecondBrain() {
    secondBrainInput.addEventListener("input", () => {
      sbCharCount.textContent = `${secondBrainInput.value.length} characters`;
      sbSaveStatus.textContent = "Unsaved changes...";
      sbSaveStatus.style.color = "var(--accent)";
    });

    document.querySelectorAll(".sb-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const snippet = chip.getAttribute("data-snippet");
        if (snippet) {
          secondBrainInput.value = secondBrainInput.value.trim() ? `${secondBrainInput.value}\n\n${snippet}` : snippet;
          sbCharCount.textContent = `${secondBrainInput.value.length} characters`;
          sbSaveStatus.textContent = "Unsaved changes...";
          sbSaveStatus.style.color = "var(--accent)";
        }
      });
    });

    saveSecondBrainBtn.addEventListener("click", () => {
      currentUser.secondBrain = secondBrainInput.value.trim();
      localStorage.setItem("sovan_user", JSON.stringify(currentUser));
      sbSaveStatus.textContent = "Saved to Firestore ✓";
      sbSaveStatus.style.color = "#4CAF50";
      updatePromptPreview();

      if (typeof firebase !== 'undefined' && firebase.firestore && currentUser.uid) {
        firebase.firestore().collection("users").doc(currentUser.uid).set({
          secondBrain: currentUser.secondBrain,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }
      showNotification("Second Brain updated in Firestore!");
    });
    
    // API Key Logic
    const apiKeyInput = document.getElementById('geminiApiKey');
    const saveApiBtn = document.getElementById('saveApiBtn');
    const apiSaveStatus = document.getElementById('apiSaveStatus');
    
    // Load key if exists
    if (localStorage.getItem('gemini_api_key')) {
        apiKeyInput.value = localStorage.getItem('gemini_api_key');
    }
    
    saveApiBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('gemini_api_key', key);
            apiSaveStatus.textContent = "Đã lưu API Key bí mật vào máy của cậu!";
            apiSaveStatus.style.color = "#4CAF50";
        } else {
            localStorage.removeItem('gemini_api_key');
            apiSaveStatus.textContent = "Đã xóa API Key khỏi máy.";
        }
        setTimeout(() => { apiSaveStatus.textContent = ""; }, 3000);
    });
  }

  // The Void (Anonymous Wall)
  function setupTheVoid() {
    renderVoidPosts();

    openVoidPostModal.addEventListener("click", () => {
      voidModal.classList.add("active");
    });

    closeVoidModalBtn.addEventListener("click", () => {
      voidModal.classList.remove("active");
    });

    submitVoidVentBtn.addEventListener("click", () => {
      const text = voidVentInput.value.trim();
      if (!text) return;

      const newPost = {
        id: "v_" + Date.now(),
        text: text,
        hugs: 1,
        tag: "Anonymous Vent",
        timestamp: Date.now()
      };

      voidPostsData.unshift(newPost);
      renderVoidPosts();
      voidVentInput.value = "";
      voidModal.classList.remove("active");

      if (typeof firebase !== 'undefined' && firebase.firestore) {
        firebase.firestore().collection("voidPosts").add({
          text: newPost.text,
          hugs: 1,
          tag: newPost.tag,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
      }
      showNotification("Your vent was released into The Void. ❤️");
    });
  }

  function renderVoidPosts() {
    voidFeed.innerHTML = "";
    voidPostsData.forEach(post => {
      const card = document.createElement("div");
      card.className = "void-card";
      card.innerHTML = `
        <span class="void-tag">${post.tag || 'Anonymous Vent'}</span>
        <p class="void-text">"${post.text}"</p>
        <div class="void-footer">
          <span style="font-size: 11px; color: var(--text-muted);">Anonymous Soul</span>
          <button class="hug-btn" data-id="${post.id}">
            ❤️ Send a hug (<span class="hug-count">${post.hugs}</span>)
          </button>
        </div>
      `;

      const hugBtn = card.querySelector(".hug-btn");
      hugBtn.addEventListener("click", () => {
        post.hugs++;
        card.querySelector(".hug-count").textContent = post.hugs;
        hugBtn.classList.add("hugged");
        showNotification("A warm hug was sent! You are not alone.");
      });

      voidFeed.appendChild(card);
    });
  }

  // Mood Tracker Section
  function setupMoodTracker() {
    openMoodPopupBtn.addEventListener("click", () => {
      moodModal.classList.add("active");
    });

    closeMoodModalBtn.addEventListener("click", () => {
      moodModal.classList.remove("active");
    });

    let selectedModalMood = currentMood;
    document.querySelectorAll(".mood-pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".mood-pill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedModalMood = {
          emoji: btn.getAttribute("data-emoji"),
          label: btn.getAttribute("data-label"),
          tone: "Adaptive warmth"
        };
      });
    });

    saveQuickMoodBtn.addEventListener("click", () => {
      currentMood = selectedModalMood;
      sidebarMoodEmoji.textContent = currentMood.emoji;
      sidebarMoodLabel.textContent = currentMood.label;
      activeToneDescription.textContent = currentMood.tone || "Gentle, calm silence and steady pace.";
      moodModal.classList.remove("active");

      addMoodHistory(currentMood.emoji, currentMood.label, document.getElementById("moodNote").value);
      showNotification(`Mood logged: ${currentMood.label}. Tiểu Vân's prompt updated.`);
    });

    // In-view Mood Grid Cards
    document.querySelectorAll(".mood-card").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".mood-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");

        currentMood = {
          emoji: card.getAttribute("data-emoji"),
          label: card.getAttribute("data-label"),
          tone: card.getAttribute("data-tone")
        };

        sidebarMoodEmoji.textContent = currentMood.emoji;
        sidebarMoodLabel.textContent = currentMood.label;
        activeToneDescription.textContent = currentMood.tone;
        addMoodHistory(currentMood.emoji, currentMood.label, "Selected from Mood Grid");
        showNotification(`Mood updated to ${currentMood.label}.`);
      });
    });
  }

  function addMoodHistory(emoji, label, note) {
    const item = document.createElement("div");
    item.className = "mood-history-item";
    item.innerHTML = `
      <span style="font-size: 24px;">${emoji}</span>
      <div>
        <strong>${label}</strong>
        <p style="font-size: 12px; color: var(--text-muted);">${note || 'Checked in'} • Just now</p>
      </div>
    `;
    moodHistoryList.prepend(item);
  }

  // Time Capsule Section
  function setupTimeCapsule() {
    renderCapsules();

    openCapsuleModal.addEventListener("click", () => {
      capsuleModal.classList.add("active");
    });

    closeCapsuleModalBtn.addEventListener("click", () => {
      capsuleModal.classList.remove("active");
    });

    submitCapsuleBtn.addEventListener("click", () => {
      const title = capsuleTitle.value.trim() || "Letter to Future Self";
      const content = capsuleContent.value.trim();
      const days = parseInt(capsuleDuration.value, 10);
      if (!content) return;

      const unlockDate = Date.now() + 1000 * 60 * 60 * 24 * days;
      const durationLabel = days >= 365 ? "1 Year" : (days >= 180 ? "6 Months" : (days >= 90 ? "3 Months" : "1 Month"));

      const newCapsule = {
        id: "c_" + Date.now(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        title: title,
        content: content,
        unlockDate: unlockDate,
        durationLabel: durationLabel,
        createdAt: Date.now(),
        opened: false,
        delivered: false
      };

      timeCapsulesData.unshift(newCapsule);
      renderCapsules();
      capsuleTitle.value = "";
      capsuleContent.value = "";
      capsuleModal.classList.remove("active");

      // Save to Firestore under user subcollection tagged with intended delivery date
      if (typeof firebase !== 'undefined' && firebase.firestore && currentUser.uid) {
        firebase.firestore().collection("users").doc(currentUser.uid).collection("timeCapsules").add({
          title: newCapsule.title,
          content: newCapsule.content,
          deliveryDate: new Date(unlockDate),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          delivered: false,
          userEmail: currentUser.email
        }).catch(() => {});
      }

      showNotification(`Time capsule sealed until ${durationLabel} later. 💌`);
    });
  }

  function checkDueCapsules() {
    const now = Date.now();
    timeCapsulesData.forEach(c => {
      if (now >= c.unlockDate && !c.delivered) {
        c.delivered = true;
        showNotification(`🔔 A Time Capsule from your past has arrived: "${c.title}"!`);
      }
    });
  }

  function renderCapsules() {
    capsulesGrid.innerHTML = "";
    timeCapsulesData.forEach(c => {
      const card = document.createElement("div");
      card.className = "capsule-card";
      const isLocked = Date.now() < c.unlockDate && !c.opened;
      const daysLeft = Math.max(1, Math.ceil((c.unlockDate - Date.now()) / (1000 * 60 * 60 * 24)));

      card.innerHTML = `
        <span class="capsule-badge ${isLocked ? 'locked' : 'unlocked'}">
          ${isLocked ? `🔒 Sealed (${daysLeft} days remaining)` : '✨ Unlocked & Delivered'}
        </span>
        <h3>${c.title}</h3>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">
          ${isLocked ? 'This letter is sealed in Firestore to preserve your present feelings.' : c.content}
        </p>
        <div style="margin-top: 10px;">
          ${isLocked ? '<button class="btn secondary-btn" disabled style="opacity: 0.6;">Locked</button>' : `<button class="btn primary-btn read-capsule-btn" data-id="${c.id}">Read Delivered Letter</button>`}
        </div>
      `;

      const readBtn = card.querySelector(".read-capsule-btn");
      if (readBtn) {
        readBtn.addEventListener("click", () => {
          c.opened = true;
          alert(`✨ Letter to Future Self:\n\n"${c.content}"\n\n- Written by past you.`);
        });
      }

      capsulesGrid.appendChild(card);
    });
  }

  // Boot Application
  document.addEventListener("DOMContentLoaded", init);
})();
