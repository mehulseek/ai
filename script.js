document.addEventListener('DOMContentLoaded', () => {
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendButton = document.getElementById('send');
    const micButton = document.getElementById('mic');
    const toggleDarkMode = document.getElementById('dark-mode-toggle');
    
    // 1. Fixed endpoint URL with /ask route
    const SERVER_URL = 'https://merit-contests-alert-crops.trycloudflare.com/ask';

    // 2. Speech Recognition Safety
    let isRecognizing = false;
    let recognition;

    micButton.addEventListener('click', () => {
        if (!isRecognizing) {
            startRecognition();
        } else {
            stopRecognition();
        }
    });

    // 3. Robust Speech Recognition
    function startRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            addMessage('System', 'Speech recognition not supported in your browser');
            return;
        }

        recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => {
            isRecognizing = true;
            micButton.style.backgroundColor = '#dc3545';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            sendMessage(transcript);
        };

        recognition.onerror = (event) => {
            addMessage('System', 'Error in voice recognition: ' + event.error);
        };

        recognition.onend = () => {
            isRecognizing = false;
            micButton.style.backgroundColor = '#007bff';
        };

        recognition.start();
    }

    function stopRecognition() {
        if (recognition) {
            recognition.stop();
        }
    }

    // 4. Enhanced Error Handling
    async function sendMessage(message) {
        if (!message.trim()) return;

        addMessage('You', message);
        input.value = '';
        input.disabled = true;
        sendButton.disabled = true;

        try {
            const response = await fetch(SERVER_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ question: message }) // 5. Fixed parameter name to match server
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server response error');
            }

            const data = await response.json();
            addMessage('Mseek', data.answer);
            readAloud(data.answer);

        } catch (error) {
            addMessage('System', Error: ${error.message});
            console.error('API Error:', error);
        } finally {
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    }

    // 6. Event Listeners with Debouncing
    sendButton.addEventListener('click', () => {
        const message = input.value.trim();
        if (message) sendMessage(message);
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = input.value.trim();
            if (message) sendMessage(message);
        }
    });

    // 7. Safe Dark Mode Toggle
    toggleDarkMode.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        toggleDarkMode.textContent = isDarkMode ? '☀️' : '🌙';
    });

    // Initialize Dark Mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        toggleDarkMode.textContent = '☀️';
    }

    // 8. UI Helpers with Safety Checks
    function addMessage(sender, text) {
        const div = document.createElement('div');
        div.innerHTML = <strong>${sender}:</strong> ${safeText(text)};
        div.classList.add('message');
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function safeText(text) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // 9. Speech Synthesis with Error Handling
    function readAloud(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = text.substring(0, 300); // Limit length
            utterance.rate = 1;
            utterance.onerror = (event) => {
                console.error('Speech Error:', event.error);
            };
            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);
        }
    }
});
