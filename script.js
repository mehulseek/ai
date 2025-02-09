document.addEventListener('DOMContentLoaded', () => {
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendButton = document.getElementById('send');
    const micButton = document.getElementById('mic');
    const toggleDarkMode = document.getElementById('dark-mode-toggle');

    // OpenRouter API Key (replace with your actual API key)
    const OPENROUTER_API_KEY = "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";

    // Custom responses
    const CUSTOM_RESPONSES = {
        name: "My name is Mseek brother of Deepseek.",
        creator: "Mehul Sarkar, a developer, made me."
    };

    // Regex patterns for custom responses
    const NAME_REGEX = /what('?s| is) your name|who are you/gi;
    const CREATOR_REGEX = /who (made|created|developed) you/gi;

    // Speech Recognition Variables
    let isRecognizing = false;
    let recognition;

    // Speech Recognition Logic
    micButton.addEventListener('click', () => {
        if (!isRecognizing) {
            startRecognition();
        } else {
            stopRecognition();
        }
    });

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

    // Send Message Logic (Backend-Free)
    async function sendMessage(message) {
        if (!message.trim()) return;

        addMessage('You', message);
        input.value = '';
        input.disabled = true;
        sendButton.disabled = true;

        try {
            // Custom response checks
            const lowerQuestion = message.toLowerCase();
            if (NAME_REGEX.test(lowerQuestion)) {
                addMessage('Mseek', CUSTOM_RESPONSES.name);
                readAloud(CUSTOM_RESPONSES.name);
                return;
            }
            if (CREATOR_REGEX.test(lowerQuestion)) {
                addMessage('Mseek', CUSTOM_RESPONSES.creator);
                readAloud(CUSTOM_RESPONSES.creator);
                return;
            }

            // Call OpenRouter API directly
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://mehulseek.github.io", // Must match frontend origin
                    "X-Title": "Mseek Assistant" // Keep under 32 chars
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: `You are Mseek. Follow these rules:
                            1. Never mention being an AI unless asked directly
                            2. For identity questions: "${CUSTOM_RESPONSES.name}"
                            3. For creator questions: "${CUSTOM_RESPONSES.creator}"
                            4. Always provide helpful, concise answers`
                        },
                        { role: "user", content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server response error');
            }

            const data = await response.json();
            const answer = data.choices[0]?.message?.content;
            addMessage('Mseek', answer);
            readAloud(answer);

        } catch (error) {
            addMessage('System', `Error: ${error.message}`);
            console.error('API Error:', error);
        } finally {
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    }

    // Event Listeners
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

    // Dark Mode Toggle
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

    // UI Helpers
    function addMessage(sender, text) {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${sender}:</strong> ${safeText(text)}`;
        div.classList.add('message');
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function safeText(text) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Speech Synthesis
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
