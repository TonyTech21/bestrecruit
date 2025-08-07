// AdvanceTravels - Professional Live Chat System

class AdvancedChatSystem {
  constructor() {
    this.socket = null;
    this.isOpen = false;
    this.sessionId = null;
    this.userName = null;
    this.unreadCount = 0;
    this.init();
  }

  init() {
    // Only initialize if socket.io is available
    if (typeof io !== 'undefined') {
      this.socket = io();
    }
    
    this.setupChatWidget();
    
    if (this.socket) {
      this.setupSocketEvents();
    }
    
    this.setupChatUI();
    this.loadChatHistory();
  }

  setupChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    if (!chatWidget) return;
    
    const chatToggle = document.getElementById('chatToggle');
    const chatClose = document.getElementById('chatClose');
    const chatWindow = document.getElementById('chatWindow');


    // Toggle chat window
    chatToggle?.addEventListener('click', () => {
      this.toggleChat();
    });

    // Close chat window
    chatClose?.addEventListener('click', () => {
      this.closeChat();
    });

    // Prevent chat window from closing when clicking inside
    chatWindow?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Close chat when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !chatWidget.contains(e.target)) {
        this.closeChat();
      }
    });
  }

  setupSocketEvents() {
    if (!this.socket) return;
    
    // Get user session info
    this.sessionId = document.querySelector('meta[name="session-id"]')?.content || 
                    localStorage.getItem('chat-session-id') || 
                    this.generateSessionId();
    
    this.userName = document.querySelector('meta[name="user-name"]')?.content || 'Guest';

    // Join user's room
    this.socket.emit('join-room', this.sessionId);

    // Listen for incoming messages
    this.socket.on('chat-message', (data) => {
      this.displayMessage(data);
      
      if (data.senderType === 'admin' && !this.isOpen) {
        this.showNotification();
        this.incrementUnreadCount();
      }

      // Play notification sound for admin messages
      if (data.senderType === 'admin') {
        this.playNotificationSound();
      }
    });

    // Handle connection status
    this.socket.on('connect', () => {
      console.log('Chat connected');
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Chat disconnected');
      this.updateConnectionStatus(false);
    });

    // Handle typing indicators
    this.socket.on('user-typing', (data) => {
      this.showTypingIndicator(data);
    });

    this.socket.on('user-stopped-typing', () => {
      this.hideTypingIndicator();
    });
  }

  setupChatUI() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('chatSend');

    if (!chatInput || !sendButton) return;

    let typingTimer;
    let isTyping = false;

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }

      // Typing indicator
      if (!isTyping && this.socket) {
        this.socket.emit('user-typing', {
          sessionId: this.sessionId,
          userName: this.userName
        });
        isTyping = true;
      }

      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        if (this.socket) {
          this.socket.emit('user-stopped-typing', {
            sessionId: this.sessionId
          });
        }
        isTyping = false;
      }, 2000);
    });

    // Send message on button click
    sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      this.autoResizeInput(chatInput);
    });

    // File upload handling
    this.setupFileUpload();
  }

  setupFileUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf,.doc,.docx';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Add file upload button to chat
    const chatInputContainer = document.querySelector('.chat-input-container');
    if (chatInputContainer) {
      const fileButton = document.createElement('button');
      fileButton.innerHTML = '📎';
      fileButton.className = 'chat-file-btn';
      fileButton.style.cssText = `
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        font-size: 1.2rem;
        color: #6b7280;
        transition: color 0.3s ease;
      `;
      
      fileButton.addEventListener('click', () => {
        fileInput.click();
      });

      fileButton.addEventListener('mouseenter', () => {
        fileButton.style.color = '#1e40af';
      });

      fileButton.addEventListener('mouseleave', () => {
        fileButton.style.color = '#6b7280';
      });

      chatInputContainer.insertBefore(fileButton, chatInputContainer.lastElementChild);
    }

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.uploadFile(file);
      }
    });
  }

  toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatToggle = document.getElementById('chatToggle');
    
    if (chatWindow) {
      chatWindow.classList.add('active');
      chatWindow.style.display = 'flex';
      
      // Animate in
      setTimeout(() => {
        chatWindow.style.transform = 'translateY(0) scale(1)';
        chatWindow.style.opacity = '1';
      }, 10);
      
      this.isOpen = true;
      this.resetUnreadCount();
      
      // Focus on input
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        setTimeout(() => chatInput.focus(), 300);
      }

      // Scroll to bottom
      this.scrollToBottom();
    }
  }

  closeChat() {
    const chatWindow = document.getElementById('chatWindow');
    
    if (chatWindow) {
      chatWindow.style.transform = 'translateY(20px) scale(0.95)';
      chatWindow.style.opacity = '0';
      
      setTimeout(() => {
        chatWindow.classList.remove('active');
        chatWindow.style.display = 'none';
      }, 300);
      
      this.isOpen = false;
    }
  }

  sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message || !this.socket) return;

    // Display message immediately for better UX
    const messageData = {
      sessionId: this.sessionId,
      sender: this.userName,
      senderType: 'user',
      message: message,
      timestamp: new Date()
    };

    this.displayMessage(messageData, true); // true for optimistic update

    // Send to server
    this.socket.emit('chat-message', messageData);

    // Clear input
    chatInput.value = '';
    this.autoResizeInput(chatInput);

    // Scroll to bottom
    this.scrollToBottom();
  }

  displayMessage(data, isOptimistic = false) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.senderType}`;
    if (isOptimistic) {
      messageDiv.classList.add('sending');
    }

    const timeString = new Date(data.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">${this.formatMessage(data.message)}</div>
        <div class="message-time">${timeString}</div>
        ${data.senderType === 'admin' ? '<div class="message-sender">Support Team</div>' : ''}
      </div>
    `;

    // Add animation
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    
    messagesContainer.appendChild(messageDiv);

    // Animate in
    setTimeout(() => {
      messageDiv.style.opacity = '1';
      messageDiv.style.transform = 'translateY(0)';
      messageDiv.style.transition = 'all 0.3s ease';
    }, 10);

    // Remove optimistic class after server confirmation
    if (isOptimistic) {
      setTimeout(() => {
        messageDiv.classList.remove('sending');
      }, 1000);
    }

    this.scrollToBottom();
  }

  formatMessage(message) {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    message = message.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
    
    // Convert line breaks to <br>
    message = message.replace(/\n/g, '<br>');
    
    return message;
  }

  showTypingIndicator(data) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    // Remove existing typing indicator
    const existingIndicator = messagesContainer.querySelector('.typing-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message admin typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="message-time">Support team is typing...</div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  autoResizeInput(input) {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  showNotification() {
    // Create floating notification
    const notification = document.createElement('div');
    notification.className = 'chat-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <strong>New message</strong>
        <p>Support team sent you a message</p>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: white;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      cursor: pointer;
      border-left: 4px solid #1e40af;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Click to open chat
    notification.addEventListener('click', () => {
      this.openChat();
      notification.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  incrementUnreadCount() {
    this.unreadCount++;
    this.updateUnreadBadge();
  }

  resetUnreadCount() {
    this.unreadCount = 0;
    this.updateUnreadBadge();
  }

  updateUnreadBadge() {
    const badge = document.getElementById('chatNotification');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  updateConnectionStatus(connected) {
    const statusIndicator = document.querySelector('.chat-connection-status');
    if (statusIndicator) {
      statusIndicator.className = `chat-connection-status ${connected ? 'connected' : 'disconnected'}`;
    }
  }

  playNotificationSound() {
    // Create audio element for notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTxp6hREAU=');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore if user hasn't interacted with page yet
    });
  }

  loadChatHistory() {
    // Only load if user is logged in
    if (!this.sessionId || this.sessionId.startsWith('session_')) return;

    fetch(`/chat/messages/${this.sessionId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.messages) {
          data.messages.forEach(message => {
            this.displayMessage(message);
          });
        }
      })
      .catch(error => {
        console.error('Failed to load chat history:', error);
      });
  }

  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', this.sessionId);

    // Show upload progress
    const progressDiv = document.createElement('div');
    progressDiv.className = 'upload-progress';
    progressDiv.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <span>Uploading ${file.name}...</span>
    `;
    
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer?.appendChild(progressDiv);

    fetch('/chat/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      progressDiv.remove();
      
      if (data.success) {
        // Send file message
        const fileMessage = {
          sessionId: this.sessionId,
          sender: this.userName,
          senderType: 'user',
          message: `📎 ${file.name}`,
          fileUrl: data.fileUrl,
          timestamp: new Date()
        };
        
        this.socket.emit('chat-message', fileMessage);
        this.displayMessage(fileMessage);
      } else {
        this.showError('Failed to upload file');
      }
    })
    .catch(error => {
      progressDiv.remove();
      this.showError('Upload failed');
      console.error('Upload error:', error);
    });
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chat-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      background: #fee2e2;
      color: #dc2626;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      margin: 0.5rem 0;
      font-size: 0.9rem;
    `;
    
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer?.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
  }

  generateSessionId() {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chat-session-id', sessionId);
    return sessionId;
  }
}

// Additional CSS for enhanced chat styling
const chatStyles = `
  .message.sending {
    opacity: 0.7;
  }

  .typing-dots {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 0.5rem 0;
  }

  .typing-dots span {
    width: 8px;
    height: 8px;
    background: #6b7280;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
  }

  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-10px);
    }
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #1e40af, #3b82f6);
    transition: width 0.3s ease;
  }

  .upload-progress {
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 8px;
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: #4b5563;
  }

  .message-sender {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .chat-connection-status {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
    transition: background 0.3s ease;
  }

  .chat-connection-status.connected {
    background: #22c55e;
  }

  #chatWindow {
    transform: translateY(20px) scale(0.95);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .chat-file-btn:hover {
    transform: scale(1.1);
  }
`;

// Inject chat styles
const chatStyleSheet = document.createElement('style');
chatStyleSheet.textContent = chatStyles;
document.head.appendChild(chatStyleSheet);

// Initialize chat system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Always initialize chat widget for all users
  if (document.getElementById('chatWidget')) {
    window.chatSystem = new AdvancedChatSystem();
  }
});