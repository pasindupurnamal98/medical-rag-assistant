/**
 * MediBot - Client Application Controller
 * Handles streaming file uploads, progress reporting, and chat sessions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // API Configurations
    const API_BASE = 'http://localhost:8000';
    const ENDPOINT_UPLOAD = `${API_BASE}/upload_pdfs/`;
    const ENDPOINT_ASK = `${API_BASE}/ask/`;

    // DOM Elements
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const progressContainer = document.getElementById('progressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressMessage = document.getElementById('progressMessage');
    const emptyFiles = document.getElementById('emptyFiles');
    const filesList = document.getElementById('filesList');
    const chatMessages = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const toast = document.getElementById('toast');
    const suggestionsContainer = document.getElementById('suggestionsContainer');

    // List of successfully uploaded files
    let uploadedFilesDb = [];

    // Initialize drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
        }, false);
    });

    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFilesUpload(files);
        }
    });

    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFilesUpload(fileInput.files);
        }
    });

    // Clear conversation
    clearChatBtn.addEventListener('click', () => {
        // Clear all but system welcome message
        const welcome = chatMessages.querySelector('.system-message');
        chatMessages.innerHTML = '';
        if (welcome) {
            chatMessages.appendChild(welcome);
        }
        showToast('Chat history cleared', 'info');
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            userInput.value = query;
            userInput.focus();
        });
    });

    // Toast notifications utility
    function showToast(message, type = 'info') {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Scroll to bottom of chat
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Append standard message to chat log
    function appendMessage(sender, content, sources = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        if (sender === 'user') {
            avatarDiv.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>`;
        } else {
            avatarDiv.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>`;
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Simple markdown parsing for bold text and list elements
        let parsedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
        
        if (parsedContent.includes('<li>')) {
            // Group lists in ul tag
            parsedContent = parsedContent.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
        }
        
        // Split text by newlines and convert to paragraphs if not a list
        const paragraphs = parsedContent.split('\n\n');
        contentDiv.innerHTML = paragraphs.map(p => {
            if (p.trim().startsWith('<ul>') || p.trim().startsWith('<li>')) return p;
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        // Handle Sources accordion if sources exist
        // Filter out empty sources or duplicates
        const uniqueSources = [...new Set(sources)].filter(s => s && s.trim() !== "");
        if (sender === 'assistant' && uniqueSources.length > 0) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'sources-container';
            
            const triggerBtn = document.createElement('button');
            triggerBtn.className = 'sources-trigger';
            triggerBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span>Sources used (${uniqueSources.length})</span>`;
            
            const listDiv = document.createElement('div');
            listDiv.className = 'sources-list';
            listDiv.style.display = 'none';
            
            uniqueSources.forEach(source => {
                // Get filename from path
                const filename = source.split(/[\\/]/).pop();
                const item = document.createElement('div');
                item.className = 'source-item';
                item.innerHTML = `<span class="source-bullet"></span><span>${filename}</span>`;
                listDiv.appendChild(item);
            });

            triggerBtn.addEventListener('click', () => {
                const isActive = triggerBtn.classList.toggle('active');
                listDiv.style.display = isActive ? 'flex' : 'none';
            });

            sourcesDiv.appendChild(triggerBtn);
            sourcesDiv.appendChild(listDiv);
            contentDiv.appendChild(sourcesDiv);
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Append typing bubble
    function showTypingIndicator() {
        const bubble = document.createElement('div');
        bubble.className = 'typing-bubble';
        bubble.id = 'typingBubble';
        bubble.innerHTML = `
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>`;
        chatMessages.appendChild(bubble);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const bubble = document.getElementById('typingBubble');
        if (bubble) bubble.remove();
    }

    // Display progress UI
    function updateProgress(percentage, message) {
        progressContainer.style.display = 'flex';
        progressBarFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
        progressMessage.textContent = message;
    }

    function hideProgress() {
        progressContainer.style.display = 'none';
    }

    // Add file to sidebar list
    function addFileToSidebar(name) {
        if (!uploadedFilesDb.includes(name)) {
            uploadedFilesDb.push(name);
        }
        
        emptyFiles.style.display = 'none';
        filesList.style.display = 'flex';

        // Render entire list to avoid duplicate listings
        filesList.innerHTML = '';
        uploadedFilesDb.forEach(filename => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = `
                <svg class="file-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span class="file-name" title="${filename}">${filename}</span>
                <span class="file-status-dot" title="Vectorized"></span>`;
            filesList.appendChild(li);
        });
    }

    // Handle Upload with Simulated Progress
    let progressInterval = null;
    let currentProgress = 0;

    function startSimulatedProgress() {
        currentProgress = 0;
        updateProgress(0, 'Connecting to server...');
        
        if (progressInterval) clearInterval(progressInterval);
        
        progressInterval = setInterval(() => {
            if (currentProgress < 95) {
                const increment = Math.max(1, Math.floor((95 - currentProgress) / 10));
                currentProgress += increment;
                
                let message = 'Uploading and processing...';
                if (currentProgress < 20) {
                    message = 'Uploading documents to backend...';
                } else if (currentProgress < 50) {
                    message = 'Parsing PDF text and structures...';
                } else if (currentProgress < 75) {
                    message = 'Generating text chunks and embedding...';
                } else {
                    message = 'Upserting vectors into Pinecone database...';
                }
                
                updateProgress(currentProgress, message);
            }
        }, 300);
    }

    function completeProgress() {
        if (progressInterval) clearInterval(progressInterval);
        updateProgress(100, 'Vectorization successfully completed!');
    }

    function resetProgress() {
        if (progressInterval) clearInterval(progressInterval);
        hideProgress();
    }

    async function handleFilesUpload(files) {
        const formData = new FormData();
        const filesArray = Array.from(files);
        
        // Validating files
        const pdfFiles = filesArray.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
        if (pdfFiles.length === 0) {
            showToast('Please upload PDF documents only', 'error');
            return;
        }

        pdfFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            // Start simulated progress increments in parallel with the request
            startSimulatedProgress();
            
            const response = await fetch(ENDPOINT_UPLOAD, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload server responded with status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Immediately complete to 100% on success!
            completeProgress();
            showToast('Vectorization complete!', 'success');
            
            // Add files to list
            pdfFiles.forEach(f => addFileToSidebar(f.name));
            setTimeout(resetProgress, 3500);

        } catch (error) {
            console.error('Vectorization error:', error);
            if (progressInterval) clearInterval(progressInterval);
            updateProgress(0, 'Error encountered during indexing');
            showToast(error.message || 'Error occurred during file processing', 'error');
            setTimeout(resetProgress, 5000);
        }
    }

    // Handle Chat Querying
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const question = userInput.value.trim();
        if (!question) return;

        // Display user message in chat log
        appendMessage('user', question);
        userInput.value = '';

        // Block UI inputs
        userInput.disabled = true;
        sendBtn.disabled = true;
        showTypingIndicator();

        // Prepare query form data
        const formData = new FormData();
        formData.append('question', question);

        try {
            const response = await fetch(ENDPOINT_ASK, {
                method: 'POST',
                body: formData
            });

            removeTypingIndicator();

            if (!response.ok) {
                throw new Error('Server error occurred during question answering');
            }

            const data = await response.json();
            
            if (data.error) {
                appendMessage('assistant', `⚠️ **Error responding**: ${data.error}`);
            } else {
                appendMessage('assistant', data.response || "No response generated.", data.sources || []);
            }

        } catch (error) {
            console.error('Query error:', error);
            removeTypingIndicator();
            appendMessage('assistant', `⚠️ **Connection Error**: Failed to reach the medical RAG backend. Verify the backend service is running on ${API_BASE}.`);
            showToast('Query failed due to network or server error', 'error');
        } finally {
            // Re-enable inputs
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    });
});
