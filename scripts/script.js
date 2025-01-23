document.addEventListener('DOMContentLoaded', () => {
    const REPO_OWNER = 'LxaNce-Hacker';
    const REPO_NAME = 'C-Language-Practice';
    const codeContainer = document.getElementById("code-container");
    const systemTime = document.getElementById("system-time");
    const loadingOverlay = document.querySelector('.loading-overlay');

    function updateSystemTime() {
        const now = new Date();
        systemTime.textContent = now.toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
    setInterval(updateSystemTime, 1000);

    async function discoverCFiles() {
        try {
            const contents = await fetchRepoContents('');
            const cFiles = await findCFilesRecursive(contents);

            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                renderCFiles(cFiles);
            }, 1500);
        } catch (error) {
            renderErrorScreen(error);
        }
    }

    async function fetchRepoContents(path) {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
        const response = await fetch(url);
        return await response.json();
    }

    async function findCFilesRecursive(contents) {
        const cFiles = [];

        for (const item of contents) {
            if (item.type === 'file' && item.name.endsWith('.c')) {
                try {
                    const fileContent = await fetchFileContent(item.download_url);
                    cFiles.push({
                        name: item.name,
                        path: item.path,
                        content: fileContent,
                        directory: item.path.split('/').slice(0, -1).join('/') || 'root'
                    });
                } catch (error) {
                    console.error(`Error fetching ${item.name}:`, error);
                }
            } else if (item.type === 'dir') {
                const subContents = await fetchRepoContents(item.path);
                const subFiles = await findCFilesRecursive(subContents);
                cFiles.push(...subFiles);
            }
        }

        return cFiles;
    }

    async function fetchFileContent(url) {
        const response = await fetch(url);
        return await response.text();
    }

    function renderCFiles(files) {
        const filesByDirectory = groupFilesByDirectory(files);

        for (const [directory, dirFiles] of Object.entries(filesByDirectory)) {
            const directorySection = document.createElement('section');
            directorySection.className = 'file-section';
            directorySection.innerHTML = `<h2>${directory} Files</h2>`;

            dirFiles.forEach(file => {
                const fileCard = document.createElement('div');
                fileCard.className = 'file-card';
                fileCard.innerHTML = `
                    <h3>${file.name}</h3>
                    <pre><code class="language-c">${escapeHtml(file.content)}</code></pre>
                `;
                directorySection.appendChild(fileCard);
            });

            codeContainer.appendChild(directorySection);
        }

        hljs.highlightAll();
    }

    function groupFilesByDirectory(files) {
        return files.reduce((acc, file) => {
            if (!acc[file.directory]) {
                acc[file.directory] = [];
            }
            acc[file.directory].push(file);
            return acc;
        }, {});
    }

    function renderErrorScreen(error) {
        loadingOverlay.innerHTML = `
            <div class="error-content">
                <h2>Repository Scan Failed</h2>
                <p>Error Details</p>
                <pre>${error.message}</pre>
            </div>
        `;
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    discoverCFiles();
});
