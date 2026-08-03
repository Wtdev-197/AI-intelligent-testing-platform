let projects = [];
let testTasks = [];
let currentProjectId = null;
let currentEditProjectId = null;
let currentDeleteProjectId = null;
let currentEnterProjectId = null;
let uploadedFile = null;
let reviewResults = [];

async function init() {
    await loadProjects();
    await loadTestTasks();
    renderProjects();
    setupUploadArea();
    restoreViewState();
}

function restoreViewState() {
    const savedProjectId = localStorage.getItem('WT_current_project_id');
    const savedView = localStorage.getItem('WT_current_view');
    if (savedProjectId) {
        currentProjectId = parseInt(savedProjectId);
        const project = projects.find(p => p.id === currentProjectId);
        if (project) {
            document.getElementById('projectGrid').parentElement.style.display = 'none';
            document.getElementById('agentView').style.display = 'block';
            const exitBtn = document.getElementById('btnExitProject');
            exitBtn.style.display = 'block';
            exitBtn.textContent = project.name + ' - 退出项目';
            document.getElementById('headerTitle').textContent = 'AI+智能体';
            
            // 如果之前是在需求评审页面，恢复该页面
            if (savedView === 'apiDocView') {
                document.getElementById('agentView').style.display = 'none';
                document.getElementById('apiDocView').style.display = 'block';
                
                // 恢复文档导入状态
                const savedDocImported = localStorage.getItem('WT_doc_imported');
                if (savedDocImported === 'true') {
                    const docMain = document.getElementById('docMain');
                    const apiDocActions = document.getElementById('apiDocActions');
                    const docTree = document.getElementById('docTree');
                    const docEditor = document.getElementById('docEditor');
                    
                    if (docMain) docMain.style.display = 'flex';
                    if (apiDocActions) apiDocActions.style.display = 'flex';
                    
                    // 检查是否有已保存的需求数据
                    const savedRequirement = localStorage.getItem('WT_requirement_saved');
                    if (savedRequirement === 'true') {
                        // 恢复已保存的文档树
                        const savedTreeHTML = localStorage.getItem('WT_saved_requirement_tree');
                        if (docTree && savedTreeHTML) {
                            docTree.innerHTML = savedTreeHTML;
                        }
                        
                        // 恢复已保存的文档内容
                        const savedContent = localStorage.getItem('WT_saved_requirement_content');
                        if (docEditor && savedContent) {
                            docEditor.innerHTML = savedContent;
                        }
                        
                        // 恢复保存按钮状态
                        const btnSave = document.getElementById('btnSaveRequirement');
                        if (btnSave) {
                            btnSave.classList.remove('btn-secondary');
                            btnSave.classList.add('btn-success');
                        }
                    } else {
                        // 恢复文档导入时的默认树结构
                        const savedTreeHTML = localStorage.getItem('WT_doc_tree');
                        if (docTree && savedTreeHTML) {
                            docTree.innerHTML = savedTreeHTML;
                        }
                        
                        // 恢复文档内容
                        const savedContent = localStorage.getItem('WT_doc_content');
                        if (docEditor && savedContent) {
                            docEditor.innerHTML = savedContent;
                        }
                    }
                }
            }
            // 如果之前是在测试用例页面，恢复该页面
            else if (savedView === 'testCaseView') {
                document.getElementById('agentView').style.display = 'none';
                document.getElementById('testCaseView').style.display = 'block';
                
                // 恢复测试用例数据
                const savedTestCases = localStorage.getItem('WT_test_cases');
                if (savedTestCases) {
                    const tableBody = document.getElementById('testCaseTableBody');
                    if (tableBody) {
                        tableBody.innerHTML = savedTestCases;
                    }
                }
            }
            // 如果之前是在UI自动化页面，恢复该页面
            else if (savedView === 'uiAutomationView') {
                document.getElementById('agentView').style.display = 'none';
                document.getElementById('uiAutomationView').style.display = 'block';
            }
            // 如果之前是在测试任务执行页面，恢复该页面
            else if (savedView === 'testTaskExecView') {
                document.getElementById('agentView').style.display = 'none';
                document.getElementById('uiAutomationView').style.display = 'none';
                document.getElementById('testTaskExecView').style.display = 'block';
                refreshTaskList();
            }
            // 如果之前是在AI接口自动化页面，恢复该页面
            else if (savedView === 'apiAutoView') {
                document.getElementById('agentView').style.display = 'none';
                document.getElementById('apiAutoView').style.display = 'block';
                loadApiCases();
            }
            // 如果之前是在AI测试数据生成系统页面，恢复该页面
            else if (savedView === 'dataGenerateView') {
                document.getElementById('agentView').style.display = 'none';
                document.getElementById('dataGenerateView').style.display = 'block';
            }
            // 如果之前是在AI性能数据分析助手页面，恢复该页面
            else if (savedView === 'performanceAnalysisView') {
                document.getElementById('agentView').style.display = 'none';
                document.getElementById('performanceAnalysisView').style.display = 'block';
                // 恢复数据源配置状态
                const savedSources = localStorage.getItem('WT_perf_data_sources');
                const savedConfig = localStorage.getItem('WT_perf_data_source');
                if ((savedSources && JSON.parse(savedSources).length > 0) || savedConfig) {
                    dataSourceConfigured = true;
                }
                // 更新状态显示
                setTimeout(() => checkDataSourceStatus(), 100);
            }
        }
    }
}

async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
            throw new Error('API returned ' + response.status);
        }
        const data = await response.json();
        if (data && data.length > 0) {
            projects = data;
        } else {
            loadDefaultProjects();
        }
    } catch (e) {
        console.error('API fetch failed:', e);
        loadDefaultProjects();
    }
}

async function loadTestTasks() {
    try {
        const response = await fetch('/api/test-tasks');
        if (!response.ok) {
            throw new Error('API returned ' + response.status);
        }
        const data = await response.json();
        if (data && data.length > 0) {
            testTasks = data;
        } else {
            const stored = localStorage.getItem('WT_test_tasks');
            if (stored) {
                testTasks = JSON.parse(stored);
                await saveTestTasks();
            }
        }
    } catch (e) {
        console.error('API fetch failed:', e);
        const stored = localStorage.getItem('WT_test_tasks');
        if (stored) {
            testTasks = JSON.parse(stored);
        }
    }
}

async function saveTestTasks() {
    try {
        const response = await fetch('/api/test-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testTasks)
        });
        if (!response.ok) {
            throw new Error('API returned ' + response.status);
        }
        localStorage.setItem('WT_test_tasks', JSON.stringify(testTasks));
    } catch (e) {
        console.error('API save failed:', e);
        localStorage.setItem('WT_test_tasks', JSON.stringify(testTasks));
    }
}

function loadDefaultProjects() {
    const stored = localStorage.getItem('WT_projects');
    if (stored) {
        projects = JSON.parse(stored);
    } else {
        projects = [
            {
                id: 1,
                name: '互联网小微保险',
                desc: '互联网保险测试',
                password: '123456',
                llmUrl: '',
                llmApiKey: '',
                llmName: '',
                vlmUrl: '',
                vlmApiKey: '',
                vlmName: '',
                createdAt: '2025-07-20T15:11:12'
            },
            {
                id: 2,
                name: '益禾·接口自动化框架',
                desc: '',
                password: '123456',
                llmUrl: '',
                llmApiKey: '',
                llmName: '',
                vlmUrl: '',
                vlmApiKey: '',
                vlmName: '',
                createdAt: '2025-09-28T15:20:20'
            },
            {
                id: 3,
                name: 'AI接口评审',
                desc: 'AI接口自动化测试框架',
                password: '123456',
                llmUrl: '',
                llmApiKey: '',
                llmName: '',
                vlmUrl: '',
                vlmApiKey: '',
                vlmName: '',
                createdAt: '2025-09-28T15:05:51'
            },
            {
                id: 4,
                name: 'WT-ai',
                desc: 'WT-ai项目',
                password: '123456',
                llmUrl: '',
                llmApiKey: '',
                llmName: '',
                vlmUrl: '',
                vlmApiKey: '',
                vlmName: '',
                createdAt: '2025-12-01T10:00:00'
            }
        ];
        saveProjects();
    }
}

async function saveProjects() {
    try {
        await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projects)
        });
    } catch (e) {
        // 如果API请求失败，使用localStorage作为后备
        localStorage.setItem('WT_projects', JSON.stringify(projects));
    }
}

function renderProjects() {
    const grid = document.getElementById('projectGrid');
    let html = `
        <div class="project-card add-project-card" onclick="showCreateModal()">
            <div class="add-icon">+</div>
            <div class="add-text">添加新项目</div>
        </div>
    `;
    
    projects.forEach(project => {
        const date = new Date(project.createdAt).toLocaleString('zh-CN');
        html += `
            <div class="project-card">
                <div class="project-header">
                    <div class="project-name">${escapeHtml(project.name)}</div>
                    <div class="project-date">${date}</div>
                </div>
                <div class="project-desc">${escapeHtml(project.desc || '')}</div>
                <div class="project-actions">
                    <button class="btn btn-primary btn-sm" onclick="showPasswordModal(${project.id})">进入项目</button>
                    <button class="btn btn-secondary btn-sm" onclick="showEditModal(${project.id})">编辑</button>
                    <button class="btn btn-danger btn-sm" onclick="showDeleteModal(${project.id})">删除</button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
    console.log('renderProjects done, grid children:', grid.children.length);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showCreateModal() {
    document.getElementById('createForm').reset();
    showModal('createModal');
}

function showEditModal(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    currentEditProjectId = projectId;
    document.getElementById('editProjectId').value = projectId;
    document.getElementById('editProjectName').value = project.name;
    document.getElementById('editProjectDesc').value = project.desc || '';
    document.getElementById('editLlmUrl').value = project.llmUrl || '';
    document.getElementById('editLlmApiKey').value = project.llmApiKey || '';
    document.getElementById('editLlmName').value = project.llmName || '';
    document.getElementById('editVlmUrl').value = project.vlmUrl || '';
    document.getElementById('editVlmApiKey').value = project.vlmApiKey || '';
    document.getElementById('editVlmName').value = project.vlmName || '';
    
    showModal('editModal');
}

function showDeleteModal(projectId) {
    currentDeleteProjectId = projectId;
    document.getElementById('deletePassword').value = '';
    showModal('deleteModal');
}

function showPasswordModal(projectId) {
    currentEnterProjectId = projectId;
    document.getElementById('enterPassword').value = '';
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
    confirmBtn.style.cursor = 'not-allowed';
    showModal('passwordModal');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        // 对于动态创建的模态框，延迟删除DOM元素
        setTimeout(() => {
            if (modal.parentNode && modal.parentNode === document.body) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
}

function removeModalElement(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }
}

function createProject() {
    const name = document.getElementById('projectName').value.trim();
    const desc = document.getElementById('projectDesc').value.trim();
    const password = document.getElementById('projectPassword').value;
    
    if (!name) {
        showToast('请输入项目名称', 'error');
        return;
    }
    
    if (!password) {
        showToast('请设置项目密码', 'error');
        return;
    }
    
    const newProject = {
        id: Date.now(),
        name: name,
        desc: desc,
        password: password,
        llmUrl: document.getElementById('llmUrl').value.trim(),
        llmApiKey: document.getElementById('llmApiKey').value.trim(),
        llmName: document.getElementById('llmName').value.trim(),
        vlmUrl: document.getElementById('vlmUrl').value.trim(),
        vlmApiKey: document.getElementById('vlmApiKey').value.trim(),
        vlmName: document.getElementById('vlmName').value.trim(),
        createdAt: new Date().toISOString()
    };
    
    projects.unshift(newProject);
    saveProjects();
    renderProjects();
    closeModal('createModal');
    showToast('项目创建成功', 'success');
}

function updateProject() {
    const projectId = parseInt(document.getElementById('editProjectId').value);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const name = document.getElementById('editProjectName').value.trim();
    if (!name) {
        showToast('请输入项目名称', 'error');
        return;
    }
    
    project.name = name;
    project.desc = document.getElementById('editProjectDesc').value.trim();
    project.llmUrl = document.getElementById('editLlmUrl').value.trim();
    project.llmApiKey = document.getElementById('editLlmApiKey').value.trim();
    project.llmName = document.getElementById('editLlmName').value.trim();
    project.vlmUrl = document.getElementById('editVlmUrl').value.trim();
    project.vlmApiKey = document.getElementById('editVlmApiKey').value.trim();
    project.vlmName = document.getElementById('editVlmName').value.trim();
    
    saveProjects();
    renderProjects();
    closeModal('editModal');
    showToast('项目更新成功', 'success');
}

function confirmDelete() {
    const password = document.getElementById('deletePassword').value;
    const project = projects.find(p => p.id === currentDeleteProjectId);
    
    if (!project) {
        showToast('项目不存在', 'error');
        return;
    }
    
    if (password !== project.password) {
        showToast('密码错误，请重新输入', 'error');
        return;
    }
    
    projects = projects.filter(p => p.id !== currentDeleteProjectId);
    saveProjects();
    renderProjects();
    closeModal('deleteModal');
    showToast('项目已删除', 'success');
}

function checkPasswordLength() {
    const password = document.getElementById('enterPassword').value;
    const confirmBtn = document.getElementById('confirmBtn');
    
    if (password.length >= 6) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
    } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
        confirmBtn.style.cursor = 'not-allowed';
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('enterPassword');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁';
    }
}

function confirmEnterProject() {
    const password = document.getElementById('enterPassword').value;
    const project = projects.find(p => p.id === currentEnterProjectId);
    
    if (!project) {
        showToast('项目不存在', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('密码长度不足6位', 'error');
        return;
    }
    
    if (password !== project.password) {
        showToast('密码错误，请重新输入', 'error');
        return;
    }
    
    currentProjectId = currentEnterProjectId;
    closeModal('passwordModal');
    showAgentView();
    showToast('欢迎进入项目：' + project.name, 'success');
}

function showAgentView() {
    document.getElementById('projectGrid').parentElement.style.display = 'none';
    document.getElementById('agentView').style.display = 'block';
    const exitBtn = document.getElementById('btnExitProject');
    exitBtn.style.display = 'block';
    const project = projects.find(p => p.id === currentProjectId);
    if (project) {
        exitBtn.textContent = project.name + ' - 退出项目';
        document.getElementById('headerTitle').textContent = 'AI+智能体';
        localStorage.setItem('WT_current_project_id', currentProjectId);
        localStorage.setItem('WT_current_view', 'agentView');
    }
}

function showTestCaseView() {
    document.getElementById('agentView').style.display = 'none';
    document.getElementById('testCaseView').style.display = 'block';
    localStorage.setItem('WT_current_view', 'testCaseView');
}

function showApiAutoView() {
    document.getElementById('agentView').style.display = 'none';
    document.getElementById('apiAutoView').style.display = 'block';
    localStorage.setItem('WT_current_view', 'apiAutoView');
    loadApiCases();
    setTimeout(refreshApiCasesDisplay, 100);
}

function loadApiCases() {
    const tableBody = document.getElementById('apiAutoTableBody');
    if (!tableBody) return;
    
    const savedData = localStorage.getItem('WT_api_cases');
    if (savedData) {
        tableBody.innerHTML = savedData;
    } else {
        const defaultCases = [
            { id: '01', priority: '高', name: '用户登录-正常登录验证' },
            { id: '02', priority: '高', name: '用户登录-密码错误验证' },
            { id: '03', priority: '高', name: '用户注册-手机号注册验证' },
            { id: '04', priority: '中', name: '订单创建-库存不足验证' },
            { id: '05', priority: '中', name: '订单取消-已支付订单验证' },
            { id: '06', priority: '中', name: '商品搜索-关键词过滤验证' },
            { id: '07', priority: '低', name: '支付回调-签名验证' },
            { id: '08', priority: '低', name: '消息推送-异常处理' }
        ];
        
        let html = '';
        defaultCases.forEach((tc, index) => {
            const priorityClass = tc.priority === '高' ? 'priority-high' : tc.priority === '中' ? 'priority-medium' : 'priority-low';
            html += `
                <tr>
                    <td><input type="checkbox"></td>
                    <td>${String(index + 1).padStart(2, '0')}</td>
                    <td><span class="priority-tag ${priorityClass}">${tc.priority}</span></td>
                    <td>${tc.name}</td>
                    <td>
                        <a href="javascript:;" class="table-action" onclick="editApiCase('${tc.id}')">编辑</a>
                        <a href="javascript:;" class="table-action" onclick="deleteApiCase(this)">删除</a>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
        localStorage.setItem('WT_api_cases', html);
    }
    
    const totalSpan = document.getElementById('apiCaseTotal');
    if (totalSpan) {
        const totalRows = tableBody.querySelectorAll('tr').length;
        totalSpan.textContent = `共 ${totalRows} 条`;
    }
}

function refreshApiCasesDisplay() {
    const tableBody = document.getElementById('apiAutoTableBody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
            const priorityText = cells[2].textContent.trim();
            if (!priorityText.includes('priority-tag')) {
                const priorityClass = priorityText === '高' ? 'priority-high' : priorityText === '中' ? 'priority-medium' : 'priority-low';
                cells[2].innerHTML = `<span class="priority-tag ${priorityClass}">${priorityText}</span>`;
            }
        }
    });
    
    localStorage.setItem('WT_api_cases', tableBody.innerHTML);
}

function searchApiCases() {
    const nameInput = document.getElementById('apiCaseName').value.trim();
    const priorityFilter = document.getElementById('apiPriorityFilter').value;
    const moduleFilter = document.getElementById('apiModuleFilter').value;
    const typeFilter = document.getElementById('apiTypeSelect').value;
    
    const tableBody = document.getElementById('apiAutoTableBody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
            const caseName = cells[3].textContent.trim().toLowerCase();
            const priorityText = cells[2].textContent.trim();
            
            let match = true;
            
            if (nameInput && !caseName.includes(nameInput.toLowerCase())) {
                match = false;
            }
            
            if (priorityFilter && priorityText !== priorityFilter) {
                match = false;
            }
            
            if (moduleFilter) {
                const caseNameLower = caseName.toLowerCase();
                if (moduleFilter === '用户模块' && !caseNameLower.includes('用户') && !caseNameLower.includes('登录') && !caseNameLower.includes('注册')) {
                    match = false;
                } else if (moduleFilter === '订单模块' && !caseNameLower.includes('订单')) {
                    match = false;
                } else if (moduleFilter === '商品模块' && !caseNameLower.includes('商品') && !caseNameLower.includes('搜索')) {
                    match = false;
                } else if (moduleFilter === '支付模块' && !caseNameLower.includes('支付')) {
                    match = false;
                }
            }
            
            row.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        }
    });
    
    const totalSpan = document.getElementById('apiCaseTotal');
    if (totalSpan) {
        totalSpan.textContent = `共 ${visibleCount} 条`;
    }
    
    if (visibleCount > 0) {
        showToast(`查询成功，找到 ${visibleCount} 条用例`, 'success');
    } else {
        showToast('未找到符合条件的用例', 'info');
    }
}

function resetApiFilters() {
    document.getElementById('apiCaseName').value = '';
    document.getElementById('apiPriorityFilter').value = '';
    document.getElementById('apiModuleFilter').value = '';
    document.getElementById('apiTypeSelect').value = 'http';
    
    const tableBody = document.getElementById('apiAutoTableBody');
    if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            row.style.display = '';
        });
        
        const totalSpan = document.getElementById('apiCaseTotal');
        if (totalSpan) {
            totalSpan.textContent = `共 ${rows.length} 条`;
        }
    }
    
    showToast('已重置筛选条件', 'success');
}

let apiTestTasks = JSON.parse(localStorage.getItem('WT_api_test_tasks') || '[]');

function createApiTestTask() {
    const tableBody = document.getElementById('apiAutoTableBody');
    const checkedBoxes = tableBody ? tableBody.querySelectorAll('input[type="checkbox"]:checked') : [];
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'createApiTaskModal';
    modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
                <h3>创建 AI 接口自动化测试任务</h3>
                <button class="modal-close" onclick="closeModal('createApiTaskModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="import-section">
                    <label class="import-label">任务名称</label>
                    <input type="text" id="apiTaskName" class="level-select" placeholder="请输入测试任务名称" required>
                </div>
                <div class="import-section">
                    <label class="import-label">接口类型</label>
                    <select id="apiTaskType" class="level-select">
                        <option value="http">HTTP 接口</option>
                        <option value="grpc">gRPC 接口</option>
                        <option value="websocket">WebSocket 接口</option>
                    </select>
                </div>
                <div class="import-section">
                    <label class="import-label">脚本语言</label>
                    <select id="apiTaskLanguage" class="level-select">
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="javascript">JavaScript</option>
                        <option value="go">Go</option>
                    </select>
                </div>
                <div class="import-section">
                    <label class="import-label">选择用例</label>
                    <div style="padding: 10px; background: #f5f7fa; border-radius: 4px; font-size: 13px; color: #606266;">
                        已选中 <strong>${checkedBoxes.length}</strong> 条用例
                        <span style="color: #909399; font-size: 12px; margin-left: 8px;">（如未选择则默认使用全部用例）</span>
                    </div>
                </div>
                <div class="import-section">
                    <label class="import-label">备注</label>
                    <textarea id="apiTaskRemark" class="level-select" placeholder="请输入备注（可选）" style="min-height: 60px; resize: vertical;"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('createApiTaskModal')">取消</button>
                <button class="btn btn-primary" onclick="confirmCreateApiTestTask()">创建任务</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmCreateApiTestTask() {
    const taskName = document.getElementById('apiTaskName').value.trim();
    const taskType = document.getElementById('apiTaskType').value;
    const taskLanguage = document.getElementById('apiTaskLanguage').value;
    const taskRemark = document.getElementById('apiTaskRemark').value.trim();
    
    if (!taskName) {
        showToast('请输入任务名称', 'error');
        return;
    }
    
    const tableBody = document.getElementById('apiAutoTableBody');
    const checkedBoxes = tableBody ? tableBody.querySelectorAll('input[type="checkbox"]:checked') : [];
    const allRows = tableBody ? tableBody.querySelectorAll('tr') : [];
    
    let selectedCases = [];
    if (checkedBoxes.length > 0) {
        checkedBoxes.forEach(cb => {
            const row = cb.closest('tr');
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                selectedCases.push({
                    id: cells[1].textContent.trim(),
                    priority: cells[2].textContent.trim(),
                    name: cells[3].textContent.trim()
                });
            }
        });
    } else {
        allRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                selectedCases.push({
                    id: cells[1].textContent.trim(),
                    priority: cells[2].textContent.trim(),
                    name: cells[3].textContent.trim()
                });
            }
        });
    }
    
    const newTask = {
        id: apiTestTasks.length + 1,
        name: taskName,
        type: taskType,
        language: taskLanguage,
        remark: taskRemark,
        caseCount: selectedCases.length,
        cases: selectedCases,
        status: '待执行',
        createdAt: new Date().toLocaleString('zh-CN')
    };
    
    apiTestTasks.push(newTask);
    localStorage.setItem('WT_api_test_tasks', JSON.stringify(apiTestTasks));
    
    closeModal('createApiTaskModal');
    showToast('测试任务创建成功', 'success');
}

function showApiTestRecords() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'apiTestRecordsModal';
    
    let tableRows = '';
    if (apiTestTasks.length === 0) {
        tableRows = '<tr><td colspan="6" style="text-align:center;color:#909399;padding:40px;">暂无测试任务</td></tr>';
    } else {
        apiTestTasks.forEach((task, index) => {
            const statusClass = task.status === '已通过' ? 'tag-green' : 
                               task.status === '已失败' ? 'tag-red' : 
                               task.status === '执行中' ? 'tag-blue' : 'tag-gray';
            const isExecuting = task.status === '执行中';
            const hasReport = task.status === '已通过' || task.status === '已失败';
            
            let actionButtons = `
                <button class="btn btn-primary btn-sm" onclick="executeApiTestTask(${index})"${isExecuting ? ' disabled' : ''}>${isExecuting ? '执行中...' : '执行'}</button>
                <button class="btn btn-danger btn-sm" onclick="deleteApiTestTask(${index})">删除</button>
            `;
            
            if (hasReport) {
                actionButtons = `
                    <button class="btn btn-secondary btn-sm" onclick="showApiTestReport(${index})">查看报告</button>
                    <button class="btn btn-primary btn-sm" onclick="executeApiTestTask(${index})">重新执行</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteApiTestTask(${index})">删除</button>
                `;
            }
            
            const typeName = task.type === 'http' ? 'HTTP' : task.type === 'grpc' ? 'gRPC' : 'WebSocket';
            const langName = task.language === 'python' ? 'Python' : task.language === 'java' ? 'Java' : task.language === 'javascript' ? 'JavaScript' : 'Go';
            
            tableRows += `
                <tr>
                    <td>${task.id}</td>
                    <td>${task.name}</td>
                    <td>${typeName}</td>
                    <td>${langName}</td>
                    <td><span class="agent-tag ${statusClass}" style="font-size:12px;">${task.status}</span></td>
                    <td>
                        ${actionButtons}
                    </td>
                </tr>
            `;
        });
    }
    
    modal.innerHTML = `
        <div class="modal" style="max-width: 900px;">
            <div class="modal-header">
                <h3>AI 接口自动化测试记录</h3>
                <button class="modal-close" onclick="closeModal('apiTestRecordsModal')">&times;</button>
            </div>
            <div class="modal-body">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f5f7fa;">
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">ID</th>
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">任务名称</th>
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">接口类型</th>
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">脚本语言</th>
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">状态</th>
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">操作</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('apiTestRecordsModal')">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function executeApiTestTask(index) {
    if (!apiTestTasks[index]) {
        showToast('任务不存在', 'error');
        return;
    }
    
    if (apiTestTasks[index].status === '执行中') {
        showToast('任务正在执行中，请稍候', 'info');
        return;
    }
    
    apiTestTasks[index].status = '执行中';
    localStorage.setItem('WT_api_test_tasks', JSON.stringify(apiTestTasks));
    showToast('测试任务开始执行...', 'info');
    
    closeModal('apiTestRecordsModal');
    setTimeout(() => {
        if (apiTestTasks[index]) {
            const passRate = 0.85 + Math.random() * 0.1;
            const passedCount = Math.floor(apiTestTasks[index].caseCount * passRate);
            const failedCount = apiTestTasks[index].caseCount - passedCount;
            
            apiTestTasks[index].status = failedCount > 0 ? '已失败' : '已通过';
            apiTestTasks[index].executedAt = new Date().toLocaleString('zh-CN');
            apiTestTasks[index].report = {
                total: apiTestTasks[index].caseCount,
                passed: passedCount,
                failed: failedCount,
                duration: (Math.random() * 5 + 2).toFixed(2) + 's'
            };
            
            localStorage.setItem('WT_api_test_tasks', JSON.stringify(apiTestTasks));
            showToast('测试任务执行完成', 'success');
            showApiTestRecords();
        }
    }, 3000);
}

function showApiTestReport(index) {
    const task = apiTestTasks[index];
    if (!task || !task.report) {
        showToast('测试报告不存在', 'error');
        return;
    }
    
    const report = task.report;
    
    let casesTableRows = '';
    task.cases.forEach((tc, i) => {
        const isPassed = i < Math.floor(report.total * 0.85);
        const statusColor = isPassed ? '#67c23a' : '#f56c6c';
        casesTableRows += `
            <tr>
                <td>${tc.id}</td>
                <td>${tc.name}</td>
                <td><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;color:white;background:${statusColor};">${isPassed ? '通过' : '失败'}</span></td>
                <td>${(Math.random() * 2 + 0.5).toFixed(2)}s</td>
                <td>${isPassed ? '-' : '断言失败：期望结果与实际结果不一致'}</td>
            </tr>
        `;
    });
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'apiTestReportModal';
    modal.innerHTML = `
        <div class="modal" style="max-width: 900px;">
            <div class="modal-header">
                <h3>测试报告 - ${task.name}</h3>
                <button class="modal-close" onclick="closeModal('apiTestReportModal')">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #409eff;">${report.total}</div>
                        <div style="font-size: 13px; color: #606266; margin-top: 4px;">总用例数</div>
                    </div>
                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #67c23a;">${report.passed}</div>
                        <div style="font-size: 13px; color: #606266; margin-top: 4px;">通过</div>
                    </div>
                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #f56c6c;">${report.failed}</div>
                        <div style="font-size: 13px; color: #606266; margin-top: 4px;">失败</div>
                    </div>
                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #e6a23c;">${((report.passed / report.total) * 100).toFixed(1)}%</div>
                        <div style="font-size: 13px; color: #606266; margin-top: 4px;">通过率</div>
                    </div>
                </div>
                <div style="margin-bottom: 20px; padding: 16px; background: #f5f7fa; border-radius: 8px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 24px; font-size: 13px; color: #606266;">
                        <div><strong>接口类型：</strong>${task.type === 'http' ? 'HTTP' : task.type === 'grpc' ? 'gRPC' : 'WebSocket'}</div>
                        <div><strong>脚本语言：</strong>${task.language === 'python' ? 'Python' : task.language === 'java' ? 'Java' : task.language === 'javascript' ? 'JavaScript' : 'Go'}</div>
                        <div><strong>执行时间：</strong>${task.executedAt}</div>
                        <div><strong>执行时长：</strong>${report.duration}</div>
                    </div>
                </div>
                <div>
                    <h4 style="font-size: 14px; font-weight: 500; color: #303133; margin-bottom: 12px;">用例详情</h4>
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f5f7fa;">
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;width:80px;">ID</th>
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">用例名称</th>
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;width:80px;">状态</th>
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;width:80px;">耗时</th>
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">错误信息</th>
                            </tr>
                        </thead>
                        <tbody>${casesTableRows}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('apiTestReportModal')">关闭</button>
                <button class="btn btn-primary" onclick="downloadApiTestReport(${index})">下载报告</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function downloadApiTestReport(index) {
    const task = apiTestTasks[index];
    if (!task || !task.report) {
        showToast('测试报告不存在', 'error');
        return;
    }
    
    const report = task.report;
    let csvContent = 'ID,用例名称,状态,耗时,错误信息\n';
    task.cases.forEach((tc, i) => {
        const isPassed = i < Math.floor(report.total * 0.85);
        csvContent += `${tc.id},"${tc.name}",${isPassed ? '通过' : '失败'},${(Math.random() * 2 + 0.5).toFixed(2)}s,"${isPassed ? '' : '断言失败'}"\n`;
    });
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${task.name}_测试报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('测试报告已下载', 'success');
}

function deleteApiTestTask(index) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'deleteApiTaskConfirmModal';
    modal.innerHTML = `
        <div class="modal modal-small">
            <div class="modal-header">
                <h3>确认删除</h3>
                <button class="modal-close" onclick="closeModal('deleteApiTaskConfirmModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>确认删除测试任务 "${apiTestTasks[index]?.name}" 吗？</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deleteApiTaskConfirmModal')">取消</button>
                <button class="btn btn-danger" onclick="confirmDeleteApiTestTask(${index})">确认删除</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmDeleteApiTestTask(index) {
    apiTestTasks.splice(index, 1);
    localStorage.setItem('WT_api_test_tasks', JSON.stringify(apiTestTasks));
    closeModal('deleteApiTaskConfirmModal');
    closeModal('apiTestRecordsModal');
    showToast('测试任务已删除', 'success');
}

function toggleApiSelectAll(checkbox) {
    const tableBody = document.getElementById('apiAutoTableBody');
    if (tableBody) {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = checkbox.checked;
        });
    }
}

function editApiCase(id) {
    const tableBody = document.getElementById('apiAutoTableBody');
    const rows = tableBody.querySelectorAll('tr');
    let caseData = null;
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4 && cells[1].textContent.trim() === id) {
            caseData = {
                id: cells[1].textContent.trim(),
                priority: cells[2].textContent.trim(),
                name: cells[3].textContent.trim()
            };
        }
    });
    
    if (!caseData) {
        showToast('未找到该用例', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'editApiCaseModal';
    modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
                <h3>编辑测试用例</h3>
                <button class="modal-close" onclick="closeModal('editApiCaseModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="import-section">
                    <label class="import-label">用例ID</label>
                    <input type="text" value="${caseData.id}" class="level-select" disabled>
                </div>
                <div class="import-section">
                    <label class="import-label">用例名称</label>
                    <input type="text" id="editCaseName" value="${caseData.name}" class="level-select" required>
                </div>
                <div class="import-section">
                    <label class="import-label">优先级</label>
                    <select id="editCasePriority" class="level-select">
                        <option value="高" ${caseData.priority === '高' ? 'selected' : ''}>高</option>
                        <option value="中" ${caseData.priority === '中' ? 'selected' : ''}>中</option>
                        <option value="低" ${caseData.priority === '低' ? 'selected' : ''}>低</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('editApiCaseModal')">取消</button>
                <button class="btn btn-primary" onclick="confirmEditApiCase('${caseData.id}')">保存</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmEditApiCase(id) {
    const newName = document.getElementById('editCaseName').value.trim();
    const newPriority = document.getElementById('editCasePriority').value;
    
    if (!newName) {
        showToast('请输入用例名称', 'error');
        return;
    }
    
    const tableBody = document.getElementById('apiAutoTableBody');
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4 && cells[1].textContent.trim() === id) {
            cells[2].textContent = newPriority;
            cells[3].textContent = newName;
        }
    });
    
    localStorage.setItem('WT_api_cases', tableBody.innerHTML);
    closeModal('editApiCaseModal');
    showToast('用例更新成功', 'success');
}

function deleteApiCase(link) {
    const row = link.closest('tr');
    const cells = row.querySelectorAll('td');
    const caseName = cells[3] ? cells[3].textContent.trim() : '';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'deleteApiCaseModal';
    modal.innerHTML = `
        <div class="modal modal-small">
            <div class="modal-header">
                <h3>确认删除</h3>
                <button class="modal-close" onclick="closeModal('deleteApiCaseModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>确认删除测试用例 "${caseName}" 吗？</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deleteApiCaseModal')">取消</button>
                <button class="btn btn-danger" onclick="confirmDeleteApiCase()">确认删除</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    window._pendingDeleteLink = link;
}

function confirmDeleteApiCase() {
    const link = window._pendingDeleteLink;
    if (link) {
        link.closest('tr').remove();
        const tableBody = document.getElementById('apiAutoTableBody');
        if (tableBody) {
            localStorage.setItem('WT_api_cases', tableBody.innerHTML);
            const totalSpan = document.getElementById('apiCaseTotal');
            if (totalSpan) {
                const totalRows = tableBody.querySelectorAll('tr').length;
                totalSpan.textContent = `共 ${totalRows} 条`;
            }
        }
    }
    closeModal('deleteApiCaseModal');
    showToast('测试用例删除成功', 'success');
}

function handleApiBatchDelete() {
    const tableBody = document.getElementById('apiAutoTableBody');
    const checkedBoxes = tableBody ? tableBody.querySelectorAll('input[type="checkbox"]:checked') : [];
    
    if (checkedBoxes.length === 0) {
        showToast('请先选择要删除的测试用例', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'batchDeleteApiModal';
    modal.innerHTML = `
        <div class="modal modal-small">
            <div class="modal-header">
                <h3>确认删除</h3>
                <button class="modal-close" onclick="closeModal('batchDeleteApiModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>是否删除选中的 ${checkedBoxes.length} 项？</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('batchDeleteApiModal')">取消</button>
                <button class="btn btn-danger" onclick="confirmBatchDeleteApiCases()">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmBatchDeleteApiCases() {
    const tableBody = document.getElementById('apiAutoTableBody');
    const checkedBoxes = tableBody ? tableBody.querySelectorAll('input[type="checkbox"]:checked') : [];
    const count = checkedBoxes.length;
    
    checkedBoxes.forEach(cb => {
        cb.closest('tr').remove();
    });
    
    if (tableBody) {
        localStorage.setItem('WT_api_cases', tableBody.innerHTML);
        const totalSpan = document.getElementById('apiCaseTotal');
        if (totalSpan) {
            const totalRows = tableBody.querySelectorAll('tr').length;
            totalSpan.textContent = `共 ${totalRows} 条`;
        }
    }
    
    const selectAllCheckbox = document.getElementById('apiSelectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }
    
    closeModal('batchDeleteApiModal');
    showToast(`已删除 ${count} 个用例`, 'success');
}

function toggleSelectAll(checkbox) {
    const tableBody = document.getElementById('testCaseTableBody');
    if (tableBody) {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = checkbox.checked;
        });
    }
}

function toggleSelectAllCases(checkbox) {
    const tableBody = document.getElementById('apiCaseTableBody');
    if (tableBody) {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = checkbox.checked;
        });
    }
}

function exportTestCase() {
    const tableBody = document.getElementById('apiCaseTableBody') || document.getElementById('testCaseTableBody');
    if (!tableBody) {
        showToast('没有可导出的测试用例', 'error');
        return;
    }
    
    const rows = tableBody.querySelectorAll('tr');
    if (rows.length === 0) {
        showToast('没有可导出的测试用例', 'error');
        return;
    }
    
    let csvContent = 'ID,用例名称,优先级\n';
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
            const id = cells[1]?.textContent?.trim() || '';
            const name = cells[2]?.textContent?.trim() || '';
            const priority = cells[3]?.textContent?.trim() || '';
            csvContent += `${id},"${name}",${priority}\n`;
        }
    });
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `接口测试用例_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('测试用例导出成功', 'success');
}

function showUIAutomationView(mode) {
    document.getElementById('agentView').style.display = 'none';
    document.getElementById('uiAutomationView').style.display = 'block';
    localStorage.setItem('WT_current_view', 'uiAutomationView');

    // 更新平台下拉框
    if (mode) {
        const platformSelect = document.getElementById('uiAutoPlatform');
        if (platformSelect) {
            platformSelect.value = mode;
        }
    }

    // 加载测试用例数据到UI自动化表格
    loadUIAutomationCases();
}

// AI测试数据生成系统功能
function showDataGenerateView() {
    // 隐藏所有视图
    document.getElementById('agentView').style.display = 'none';
    document.getElementById('apiDocView').style.display = 'none';
    document.getElementById('testCaseView').style.display = 'none';
    document.getElementById('apiAutoView').style.display = 'none';
    document.getElementById('uiAutomationView').style.display = 'none';
    document.getElementById('testTaskExecView').style.display = 'none';
    // 显示数据生成视图
    document.getElementById('dataGenerateView').style.display = 'block';
    localStorage.setItem('WT_current_view', 'dataGenerateView');
}

function addFieldConfig() {
    const container = document.getElementById('fieldsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'field-config-row';
    newRow.innerHTML = `
        <input type="text" class="field-name" placeholder="字段名">
        <select class="field-type">
            <option value="int">整数</option>
            <option value="string">字符串</option>
            <option value="float">浮点数</option>
            <option value="boolean">布尔值</option>
            <option value="date">日期</option>
            <option value="email">邮箱</option>
            <option value="phone">手机号</option>
            <option value="idcard">身份证</option>
            <option value="address">地址</option>
        </select>
        <input type="text" class="field-rule" placeholder="描述该字段的生成规则">
        <button class="field-delete" onclick="deleteFieldConfig(this)">🗑️</button>
    `;
    container.appendChild(newRow);
}

function deleteFieldConfig(btn) {
    const container = document.getElementById('fieldsContainer');
    if (container.children.length <= 1) {
        showToast('至少保留一个字段', 'error');
        return;
    }
    btn.parentElement.remove();
}

function runDataGeneration() {
    const count = document.getElementById('dataCount').value;
    const format = document.getElementById('dataFormat').value;
    const language = document.getElementById('dataLanguage').value;
    const example = document.getElementById('exampleInput').value;
    const resultStatus = document.getElementById('resultStatus');
    const jsonPreview = document.getElementById('jsonPreview');
    
    // 获取字段配置
    const fields = [];
    const rows = document.querySelectorAll('.field-config-row');
    rows.forEach(row => {
        const name = row.querySelector('.field-name').value;
        const type = row.querySelector('.field-type').value;
        const rule = row.querySelector('.field-rule').value;
        if (name) {
            fields.push({ name, type, rule });
        }
    });
    
    if (fields.length === 0) {
        showToast('请至少配置一个字段', 'error');
        return;
    }
    
    // 显示加载状态
    resultStatus.style.display = 'none';
    jsonPreview.innerHTML = '<pre class="json-preview-content">// 正在生成数据...</pre>';
    
    // 模拟生成数据
    setTimeout(() => {
        const startTime = Date.now();
        const data = generateMockData(parseInt(count), fields, language);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // 显示结果状态
        resultStatus.style.display = 'block';
        resultStatus.querySelector('.status-text').textContent = `✓ 生成成功，耗时${elapsed}秒，共${count}条数据`;
        
        // 显示JSON预览
        const jsonStr = JSON.stringify(data, null, 2);
        jsonPreview.innerHTML = `<pre class="json-preview-content">${escapeHtml(jsonStr)}</pre>`;
        
        showToast(`成功生成${count}条数据`, 'success');
    }, 800);
}

function generateMockData(count, fields, language) {
    const data = [];
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    const enNames = ['John', 'Mary', 'Bob', 'Alice', 'Charlie', 'Diana'];
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都'];
    const enCities = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen'];
    
    for (let i = 0; i < Math.min(count, 50); i++) {
        const record = {};
        fields.forEach(field => {
            switch (field.type) {
                case 'int':
                    record[field.name] = Math.floor(Math.random() * 10000) + 1;
                    break;
                case 'float':
                    record[field.name] = (Math.random() * 1000).toFixed(2);
                    break;
                case 'boolean':
                    record[field.name] = Math.random() > 0.5;
                    break;
                case 'date':
                    const year = 2020 + Math.floor(Math.random() * 5);
                    const month = Math.floor(Math.random() * 12) + 1;
                    const day = Math.floor(Math.random() * 28) + 1;
                    record[field.name] = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    break;
                case 'email':
                    record[field.name] = `user${i}@example.com`;
                    break;
                case 'phone':
                    record[field.name] = `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
                    break;
                case 'idcard':
                    record[field.name] = `${String(Math.floor(Math.random() * 10000000000000)).padStart(14, '0')}X`;
                    break;
                case 'address':
                    const city = language === 'en' ? enCities[i % enCities.length] : cities[i % cities.length];
                    record[field.name] = `${city}市朝阳区建国路${Math.floor(Math.random() * 1000)}号`;
                    break;
                case 'string':
                default:
                    if (field.name.toLowerCase().includes('name') || field.name.includes('名称')) {
                        record[field.name] = language === 'en' ? enNames[i % enNames.length] : names[i % names.length];
                    } else {
                        record[field.name] = `${field.name}_${i + 1}`;
                    }
                    break;
            }
        });
        data.push(record);
    }
    return data;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveAsTemplate() {
    const template = {
        dataCount: document.getElementById('dataCount').value,
        dataFormat: document.getElementById('dataFormat').value,
        dataLanguage: document.getElementById('dataLanguage').value,
        exampleInput: document.getElementById('exampleInput').value,
        fields: []
    };
    
    const rows = document.querySelectorAll('.field-config-row');
    rows.forEach(row => {
        template.fields.push({
            name: row.querySelector('.field-name').value,
            type: row.querySelector('.field-type').value,
            rule: row.querySelector('.field-rule').value
        });
    });
    
    localStorage.setItem('WT_data_template', JSON.stringify(template));
    showToast('模板保存成功', 'success');
}

function loadTemplate() {
    const savedTemplate = localStorage.getItem('WT_data_template');
    if (!savedTemplate) {
        showToast('没有保存的模板', 'error');
        return;
    }
    
    try {
        const template = JSON.parse(savedTemplate);
        document.getElementById('dataCount').value = template.dataCount || 100;
        document.getElementById('dataFormat').value = template.dataFormat || 'json';
        document.getElementById('dataLanguage').value = template.dataLanguage || 'zh';
        document.getElementById('exampleInput').value = template.exampleInput || '';
        
        // 重建字段
        const container = document.getElementById('fieldsContainer');
        container.innerHTML = '';
        (template.fields || []).forEach(field => {
            const newRow = document.createElement('div');
            newRow.className = 'field-config-row';
            newRow.innerHTML = `
                <input type="text" class="field-name" placeholder="字段名" value="${field.name || ''}">
                <select class="field-type">
                    <option value="int" ${field.type === 'int' ? 'selected' : ''}>整数</option>
                    <option value="string" ${field.type === 'string' ? 'selected' : ''}>字符串</option>
                    <option value="float" ${field.type === 'float' ? 'selected' : ''}>浮点数</option>
                    <option value="boolean" ${field.type === 'boolean' ? 'selected' : ''}>布尔值</option>
                    <option value="date" ${field.type === 'date' ? 'selected' : ''}>日期</option>
                    <option value="email" ${field.type === 'email' ? 'selected' : ''}>邮箱</option>
                    <option value="phone" ${field.type === 'phone' ? 'selected' : ''}>手机号</option>
                    <option value="idcard" ${field.type === 'idcard' ? 'selected' : ''}>身份证</option>
                    <option value="address" ${field.type === 'address' ? 'selected' : ''}>地址</option>
                </select>
                <input type="text" class="field-rule" placeholder="描述该字段的生成规则" value="${field.rule || ''}">
                <button class="field-delete" onclick="deleteFieldConfig(this)">🗑️</button>
            `;
            container.appendChild(newRow);
        });
        
        showToast('模板加载成功', 'success');
    } catch (e) {
        showToast('模板加载失败', 'error');
    }
}

function copyJsonResult() {
    const jsonPreview = document.getElementById('jsonPreview');
    const content = jsonPreview.querySelector('.json-preview-content');
    if (!content || content.textContent.includes('点击')) {
        showToast('请先生成数据', 'error');
        return;
    }
    
    navigator.clipboard.writeText(content.textContent).then(() => {
        showToast('JSON已复制到剪贴板', 'success');
    }).catch(() => {
        showToast('复制失败', 'error');
    });
}

function downloadJson() {
    const jsonPreview = document.getElementById('jsonPreview');
    const content = jsonPreview.querySelector('.json-preview-content');
    if (!content || content.textContent.includes('点击')) {
        showToast('请先生成数据', 'error');
        return;
    }
    
    const format = document.getElementById('dataFormat').value;
    const data = content.textContent;
    let blob, fileName;
    
    switch (format) {
        case 'json':
            blob = new Blob([data], { type: 'application/json' });
            fileName = `test_data_${Date.now()}.json`;
            break;
        case 'xml':
            blob = new Blob([jsonToXml(JSON.parse(data.substring(0, data.lastIndexOf(']') + 1)))], { type: 'application/xml' });
            fileName = `test_data_${Date.now()}.xml`;
            break;
        case 'csv':
            blob = new Blob([jsonToCsv(JSON.parse(data.substring(0, data.lastIndexOf(']') + 1)))], { type: 'text/csv' });
            fileName = `test_data_${Date.now()}.csv`;
            break;
        default:
            blob = new Blob([data], { type: 'text/plain' });
            fileName = `test_data_${Date.now()}.txt`;
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    showToast('文件下载成功', 'success');
}

function jsonToCsv(data) {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csv = [headers.join(',')];
    data.forEach(row => {
        csv.push(headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','));
    });
    return csv.join('\n');
}

function jsonToXml(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
    data.forEach((row, i) => {
        xml += '  <record>\n';
        Object.keys(row).forEach(key => {
            xml += `    <${key}>${row[key]}</${key}>\n`;
        });
        xml += '  </record>\n';
    });
    xml += '</data>';
    return xml;
}

// AI性能数据分析助手功能
let dataSourceConfigured = false;

// 性能分析日志工具
const PERF_LOG_PREFIX = '[PerfAnalysis]';
function perfLog(msg, data) {
    if (data !== undefined) {
        console.log(PERF_LOG_PREFIX, msg, data);
    } else {
        console.log(PERF_LOG_PREFIX, msg);
    }
}
function perfLogError(msg, error) {
    console.error(PERF_LOG_PREFIX, msg, error);
}

function showPerformanceAnalysisView() {
    perfLog('showPerformanceAnalysisView 开始');
    try {
        // 隐藏所有视图
        const views = ['agentView', 'apiDocView', 'testCaseView', 'apiAutoView', 'dataGenerateView', 'uiAutomationView', 'testTaskExecView'];
        views.forEach(viewId => {
            const el = document.getElementById(viewId);
            if (el) {
                el.style.display = 'none';
            } else {
                perfLogError(`视图元素不存在: ${viewId}`);
            }
        });
        // 显示性能分析视图
        const perfView = document.getElementById('performanceAnalysisView');
        if (!perfView) {
            perfLogError('performanceAnalysisView 元素不存在，无法显示');
            return;
        }
        perfView.style.display = 'block';
        localStorage.setItem('WT_current_view', 'performanceAnalysisView');
        perfLog('视图已切换到 performanceAnalysisView');

        // 初始化时间范围
        initTimeRange();

        // 检查数据源配置状态
        checkDataSourceStatus();
        perfLog('showPerformanceAnalysisView 完成');
    } catch (err) {
        perfLogError('showPerformanceAnalysisView 异常', err);
    }
}

function initTimeRange() {
    perfLog('initTimeRange 开始');
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const endInput = document.getElementById('perfEndTime');
        const startInput = document.getElementById('perfStartTime');

        if (!endInput || !startInput) {
            perfLogError('initTimeRange: 时间输入框元素不存在', { endInput: !!endInput, startInput: !!startInput });
            return;
        }

        if (!endInput.value) {
            endInput.value = formatDateTime(now);
            perfLog('设置结束时间', endInput.value);
        }
        if (!startInput.value) {
            startInput.value = formatDateTime(oneHourAgo);
            perfLog('设置开始时间', startInput.value);
        }
        perfLog('initTimeRange 完成');
    } catch (err) {
        perfLogError('initTimeRange 异常', err);
    }
}

function formatDateTime(date) {
    const pad = n => String(n).padStart(2, '0');
    const result = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return result;
}

function checkDataSourceStatus() {
    perfLog('checkDataSourceStatus 开始');
    try {
        // 从localStorage恢复配置状态
        const savedSources = localStorage.getItem('WT_perf_data_sources');
        const savedConfig = localStorage.getItem('WT_perf_data_source');
        perfLog('localStorage 数据源数据', { savedSources, savedConfig });

        if ((savedSources && JSON.parse(savedSources).length > 0) || savedConfig) {
            dataSourceConfigured = true;
        }
        perfLog('dataSourceConfigured 状态', dataSourceConfigured);

        const statusEl = document.getElementById('dataSourceStatus');
        if (!statusEl) {
            perfLogError('checkDataSourceStatus: dataSourceStatus 元素不存在');
            return;
        }
        if (dataSourceConfigured) {
            statusEl.textContent = '(已启用)';
            statusEl.className = 'perf-status tag-success';
            perfLog('数据源状态显示为: 已启用');
        } else {
            statusEl.textContent = '(尚未启用)';
            statusEl.className = 'perf-status tag-warning';
            perfLog('数据源状态显示为: 尚未启用');
        }
    } catch (err) {
        perfLogError('checkDataSourceStatus 异常', err);
    }
}

// 存储已配置的数据源列表
let dataSources = [];

function configDataSource() {
    perfLog('configDataSource 开始');
    try {
        // 检查模态框是否已存在
        let modal = document.getElementById('configDataSourceModal');
        if (modal) {
            perfLog('模态框已存在，先移除旧模态框');
            modal.remove();
        }

        modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'configDataSourceModal';
        modal.innerHTML = `
            <div class="modal modal-large">
                <div class="modal-header">
                    <h3>监控数据源配置</h3>
                    <button class="modal-close" onclick="closeConfigModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="data-source-add">
                        <input type="text" id="newSourceName" placeholder="输入名称" class="source-input">
                        <input type="text" id="newSourceUrl" placeholder="监控系统接口URL地址" class="source-input source-url">
                        <button class="btn btn-primary btn-sm" onclick="addDataSource()">添加</button>
                    </div>
                    <div class="data-source-list">
                        <table class="source-table">
                            <thead>
                                <tr>
                                    <th>名称</th>
                                    <th>地址</th>
                                    <th style="width: 80px;">操作</th>
                                </tr>
                            </thead>
                            <tbody id="sourceTableBody">
                                <tr class="source-empty">
                                    <td colspan="3">暂无数据源，请添加</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeConfigModal()">取消</button>
                    <button class="btn btn-primary" onclick="saveDataSources()">永久保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        perfLog('数据源配置模态框已创建并添加到 DOM');

        // 加载已保存的数据源
        loadSavedDataSources();
        perfLog('configDataSource 完成');
    } catch (err) {
        perfLogError('configDataSource 异常', err);
    }
}

function closeConfigModal() {
    perfLog('closeConfigModal 开始');
    try {
        const modal = document.getElementById('configDataSourceModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                    perfLog('closeConfigModal: 模态框DOM已删除');
                }
            }, 300);
        } else {
            perfLog('closeConfigModal: 模态框不存在');
        }
    } catch (err) {
        perfLogError('closeConfigModal 异常', err);
    }
}

function addDataSource() {
    perfLog('addDataSource 开始');
    try {
        const nameInput = document.getElementById('newSourceName');
        const urlInput = document.getElementById('newSourceUrl');

        if (!nameInput || !urlInput) {
            perfLogError('addDataSource: 输入框元素不存在', { nameInput: !!nameInput, urlInput: !!urlInput });
            return;
        }

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        perfLog('添加数据源', { name, url });

        if (!name || !url) {
            perfLog('addDataSource: 名称或地址为空，已拦截');
            showToast('请填写名称和地址', 'error');
            return;
        }

        dataSources.push({ name, url });
        perfLog('数据源已添加，当前列表长度', dataSources.length);
        renderDataSourceList();

        nameInput.value = '';
        urlInput.value = '';
    } catch (err) {
        perfLogError('addDataSource 异常', err);
    }
}

function removeDataSource(index) {
    perfLog('removeDataSource 开始', { index });
    try {
        if (index < 0 || index >= dataSources.length) {
            perfLogError('removeDataSource: 索引越界', { index, length: dataSources.length });
            return;
        }
        dataSources.splice(index, 1);
        perfLog('数据源已删除，剩余数量', dataSources.length);
        renderDataSourceList();
    } catch (err) {
        perfLogError('removeDataSource 异常', err);
    }
}

function renderDataSourceList() {
    perfLog('renderDataSourceList 开始，数据源数量', dataSources.length);
    try {
        const tbody = document.getElementById('sourceTableBody');
        if (!tbody) {
            perfLogError('renderDataSourceList: sourceTableBody 元素不存在');
            return;
        }

        if (dataSources.length === 0) {
            tbody.innerHTML = '<tr class="source-empty"><td colspan="3">暂无数据源，请添加</td></tr>';
            perfLog('renderDataSourceList: 数据源为空，显示空状态');
            return;
        }

        tbody.innerHTML = dataSources.map((source, index) => `
            <tr>
                <td>${escapeHtml(source.name)}</td>
                <td class="source-url-cell">${escapeHtml(source.url)}</td>
                <td>
                    <button class="source-delete-btn" onclick="removeDataSource(${index})" title="删除">🗑️</button>
                </td>
            </tr>
        `).join('');
        perfLog('renderDataSourceList 完成，已渲染行数', dataSources.length);
    } catch (err) {
        perfLogError('renderDataSourceList 异常', err);
    }
}

function loadSavedDataSources() {
    perfLog('loadSavedDataSources 开始');
    try {
        const saved = localStorage.getItem('WT_perf_data_sources');
        perfLog('localStorage 中的数据源', saved);
        if (saved) {
            try {
                dataSources = JSON.parse(saved);
                perfLog('已解析数据源列表', dataSources);
                renderDataSourceList();
            } catch (e) {
                perfLogError('loadSavedDataSources: JSON 解析失败', e);
                dataSources = [];
            }
        } else {
            perfLog('loadSavedDataSources: 无已保存的数据源');
        }
    } catch (err) {
        perfLogError('loadSavedDataSources 异常', err);
    }
}

function saveDataSources() {
    perfLog('saveDataSources 开始，数据源数量', dataSources.length);
    try {
        if (dataSources.length === 0) {
            perfLog('saveDataSources: 数据源为空，已拦截');
            showToast('请至少添加一个数据源', 'error');
            return;
        }

        localStorage.setItem('WT_perf_data_sources', JSON.stringify(dataSources));
        perfLog('数据源列表已保存到 localStorage');

        // 更新第一个数据源为当前活动数据源
        const primarySource = dataSources[0];
        localStorage.setItem('WT_perf_data_source', JSON.stringify({
            type: 'http',
            url: primarySource.url,
            authType: 'none',
            collectInterval: '10'
        }));
        perfLog('主数据源已保存', primarySource);

        dataSourceConfigured = true;
        checkDataSourceStatus();
        closeConfigModal();
        showToast('数据源保存成功', 'success');
        perfLog('saveDataSources 完成');
    } catch (err) {
        perfLogError('saveDataSources 异常', err);
        showToast('数据源保存失败', 'error');
    }
}

function refreshDataSource() {
    perfLog('refreshDataSource 开始');
    try {
        if (!dataSourceConfigured) {
            perfLog('refreshDataSource: 数据源未配置，已拦截');
            showToast('请先配置数据源', 'warning');
            return;
        }

        const statusEl = document.getElementById('dataSourceStatus');
        if (!statusEl) {
            perfLogError('refreshDataSource: dataSourceStatus 元素不存在');
            return;
        }
        statusEl.textContent = '(连接中...)';
        perfLog('数据源状态更新为: 连接中...');

        setTimeout(() => {
            statusEl.textContent = '(已启用)';
            showToast('数据源刷新成功', 'success');
            perfLog('数据源刷新完成');
        }, 1000);
    } catch (err) {
        perfLogError('refreshDataSource 异常', err);
    }
}

// 性能分析历史记录
let perfHistory = [];

function loadPerfHistory() {
    perfLog('loadPerfHistory 开始');
    try {
        const saved = localStorage.getItem('WT_perf_history');
        perfLog('localStorage 中的历史记录', saved ? `长度=${saved.length}` : 'null');
        if (saved) {
            try {
                perfHistory = JSON.parse(saved);
                perfLog('历史记录已加载，数量', perfHistory.length);
            } catch (e) {
                perfLogError('loadPerfHistory: JSON 解析失败', e);
                perfHistory = [];
            }
        } else {
            perfLog('loadPerfHistory: 无已保存的历史记录');
        }
    } catch (err) {
        perfLogError('loadPerfHistory 异常', err);
    }
}

function savePerfHistory() {
    perfLog('savePerfHistory 开始，记录数量', perfHistory.length);
    try {
        localStorage.setItem('WT_perf_history', JSON.stringify(perfHistory));
        perfLog('历史记录已保存到 localStorage');
    } catch (err) {
        perfLogError('savePerfHistory 异常', err);
    }
}

function startPerformanceAnalysis() {
    perfLog('startPerformanceAnalysis 开始');
    try {
        if (!dataSourceConfigured) {
            perfLog('startPerformanceAnalysis: 数据源未配置，已拦截');
            showToast('请先配置数据源', 'warning');
            return;
        }

        const resultDiv = document.getElementById('perfResult');
        if (!resultDiv) {
            perfLogError('startPerformanceAnalysis: perfResult 元素不存在');
            return;
        }
        resultDiv.innerHTML = '<div class="perf-empty-state"><div class="perf-empty-icon">⏳</div><div class="perf-empty-text">正在分析中，请稍候...</div></div>';
        perfLog('已显示加载状态');

        setTimeout(() => {
            perfLog('分析定时器回调开始执行');
            try {
                const startTime = document.getElementById('perfStartTime').value;
                const endTime = document.getElementById('perfEndTime').value;
                perfLog('分析时间范围', { startTime, endTime });

                // 生成模拟分析结果
                const metrics = generateMockMetrics();
                const alerts = generateMockAlerts();
                perfLog('生成的指标数据', metrics);
                perfLog('生成的预警数据', alerts);

                // 保存到历史记录
                loadPerfHistory();
                const historyRecord = {
                    id: Date.now(),
                    timestamp: new Date().toLocaleString('zh-CN'),
                    startTime: startTime,
                    endTime: endTime,
                    metrics: metrics,
                    alerts: alerts
                };
                perfHistory.unshift(historyRecord);
                perfLog('历史记录已添加', { id: historyRecord.id, timestamp: historyRecord.timestamp });
                // 只保留最近20条记录
                if (perfHistory.length > 20) {
                    perfLog('历史记录超过20条，截断', perfHistory.length);
                    perfHistory = perfHistory.slice(0, 20);
                }
                savePerfHistory();

                resultDiv.innerHTML = `
                    <div class="perf-result-content">
                        <div class="perf-metrics">
                            <div class="perf-metric-card">
                                <div class="perf-metric-label">平均响应时间</div>
                                <div class="perf-metric-value ${metrics.avgResponseTime > 500 ? 'warning' : 'success'}">${metrics.avgResponseTime}ms</div>
                            </div>
                            <div class="perf-metric-card">
                                <div class="perf-metric-label">吞吐量</div>
                                <div class="perf-metric-value success">${metrics.throughput}/s</div>
                            </div>
                            <div class="perf-metric-card">
                                <div class="perf-metric-label">错误率</div>
                                <div class="perf-metric-value ${metrics.errorRate > 5 ? 'danger' : metrics.errorRate > 2 ? 'warning' : 'success'}">${metrics.errorRate}%</div>
                            </div>
                            <div class="perf-metric-card">
                                <div class="perf-metric-label">并发数</div>
                                <div class="perf-metric-value">${metrics.concurrency}</div>
                            </div>
                            <div class="perf-metric-card">
                                <div class="perf-metric-label">CPU使用率</div>
                                <div class="perf-metric-value ${metrics.cpuUsage > 80 ? 'danger' : metrics.cpuUsage > 60 ? 'warning' : 'success'}">${metrics.cpuUsage}%</div>
                            </div>
                            <div class="perf-metric-card">
                                <div class="perf-metric-label">内存使用率</div>
                                <div class="perf-metric-value ${metrics.memoryUsage > 80 ? 'danger' : metrics.memoryUsage > 60 ? 'warning' : 'success'}">${metrics.memoryUsage}%</div>
                            </div>
                        </div>

                        <div class="perf-chart">
                            <div class="perf-chart-title">响应时间趋势（${startTime || '最近1小时'} - ${endTime || '现在'}）</div>
                            <div class="perf-chart-placeholder" id="perfChart">
                                ${generateChartBars(metrics.responseTimeSeries)}
                            </div>
                        </div>

                        ${alerts.length > 0 ? `
                            <div class="perf-alerts">
                                <div class="perf-alerts-title">⚠️ 异常预警（${alerts.length}条）</div>
                                ${alerts.map(a => `<div class="perf-alert-item"><span class="perf-alert-icon">⚠</span>${a}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                perfLog('分析结果已渲染到页面');
                showToast('性能分析完成，已保存到历史记录', 'success');
                perfLog('startPerformanceAnalysis 完成');
            } catch (innerErr) {
                perfLogError('startPerformanceAnalysis 定时器回调异常', innerErr);
                resultDiv.innerHTML = '<div class="perf-empty-state"><div class="perf-empty-icon">❌</div><div class="perf-empty-text">分析失败，请查看控制台日志</div></div>';
                showToast('性能分析失败', 'error');
            }
        }, 1500);
    } catch (err) {
        perfLogError('startPerformanceAnalysis 异常', err);
    }
}

function viewPerfHistory() {
    perfLog('viewPerfHistory 开始');
    try {
        loadPerfHistory();
        perfLog('历史记录数量', perfHistory.length);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'perfHistoryModal';

        if (perfHistory.length === 0) {
            perfLog('viewPerfHistory: 无历史记录，显示空状态');
            modal.innerHTML = `
                <div class="modal modal-large">
                    <div class="modal-header">
                        <h3>性能分析历史记录</h3>
                        <button class="modal-close" onclick="closePerfHistory()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="perf-empty-state">
                            <div class="perf-empty-icon">📋</div>
                            <div class="perf-empty-text">暂无历史记录</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closePerfHistory()">关闭</button>
                    </div>
                </div>
            `;
        } else {
            perfLog('viewPerfHistory: 渲染历史记录列表');
            modal.innerHTML = `
                <div class="modal modal-large">
                    <div class="modal-header">
                        <h3>性能分析历史记录（共${perfHistory.length}条）</h3>
                        <button class="modal-close" onclick="closePerfHistory()">&times;</button>
                    </div>
                    <div class="modal-body perf-history-body">
                        <div class="perf-history-list">
                            ${perfHistory.map((record, index) => `
                                <div class="perf-history-item">
                                    <div class="perf-history-header">
                                        <span class="perf-history-time">📅 ${record.timestamp}</span>
                                        <div class="perf-history-actions">
                                            <button class="btn btn-primary btn-sm" onclick="viewHistoryDetail(${index})">查看详情</button>
                                            <button class="btn btn-danger btn-sm" onclick="deleteHistoryRecord(${index})">删除</button>
                                        </div>
                                    </div>
                                    <div class="perf-history-summary">
                                        <span>响应时间: ${record.metrics.avgResponseTime}ms</span>
                                        <span>吞吐量: ${record.metrics.throughput}/s</span>
                                        <span>错误率: ${record.metrics.errorRate}%</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="clearPerfHistory()">清空历史</button>
                        <button class="btn btn-secondary" onclick="closePerfHistory()">关闭</button>
                    </div>
                </div>
            `;
        }

        document.body.appendChild(modal);
        perfLog('viewPerfHistory 完成');
    } catch (err) {
        perfLogError('viewPerfHistory 异常', err);
    }
}

function closePerfHistory() {
    perfLog('closePerfHistory 开始');
    try {
        const modal = document.getElementById('perfHistoryModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                    perfLog('closePerfHistory: 模态框DOM已删除');
                }
            }, 300);
        } else {
            perfLog('closePerfHistory: 模态框不存在');
        }
    } catch (err) {
        perfLogError('closePerfHistory 异常', err);
    }
}

function viewHistoryDetail(index) {
    perfLog('viewHistoryDetail 开始', { index });
    try {
        loadPerfHistory();
        const record = perfHistory[index];
        if (!record) {
            perfLogError('viewHistoryDetail: 记录不存在', { index, total: perfHistory.length });
            return;
        }
        perfLog('查看详情记录', { id: record.id, timestamp: record.timestamp });

        const detailModal = document.createElement('div');
        detailModal.className = 'modal-overlay active';
        detailModal.id = 'perfDetailModal';

        detailModal.innerHTML = `
            <div class="modal modal-large">
                <div class="modal-header">
                    <h3>历史记录详情</h3>
                    <button class="modal-close" onclick="closePerfDetail()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="perf-detail-info">
                        <p><strong>分析时间：</strong>${record.timestamp}</p>
                        <p><strong>数据范围：</strong>${record.startTime || '最近1小时'} 至 ${record.endTime || '现在'}</p>
                    </div>
                    <div class="perf-metrics">
                        <div class="perf-metric-card">
                            <div class="perf-metric-label">平均响应时间</div>
                            <div class="perf-metric-value ${record.metrics.avgResponseTime > 500 ? 'warning' : 'success'}">${record.metrics.avgResponseTime}ms</div>
                        </div>
                        <div class="perf-metric-card">
                            <div class="perf-metric-label">吞吐量</div>
                            <div class="perf-metric-value success">${record.metrics.throughput}/s</div>
                        </div>
                        <div class="perf-metric-card">
                            <div class="perf-metric-label">错误率</div>
                            <div class="perf-metric-value ${record.metrics.errorRate > 5 ? 'danger' : record.metrics.errorRate > 2 ? 'warning' : 'success'}">${record.metrics.errorRate}%</div>
                        </div>
                        <div class="perf-metric-card">
                            <div class="perf-metric-label">并发数</div>
                            <div class="perf-metric-value">${record.metrics.concurrency}</div>
                        </div>
                        <div class="perf-metric-card">
                            <div class="perf-metric-label">CPU使用率</div>
                            <div class="perf-metric-value ${record.metrics.cpuUsage > 80 ? 'danger' : record.metrics.cpuUsage > 60 ? 'warning' : 'success'}">${record.metrics.cpuUsage}%</div>
                        </div>
                        <div class="perf-metric-card">
                            <div class="perf-metric-label">内存使用率</div>
                            <div class="perf-metric-value ${record.metrics.memoryUsage > 80 ? 'danger' : record.metrics.memoryUsage > 60 ? 'warning' : 'success'}">${record.metrics.memoryUsage}%</div>
                        </div>
                    </div>
                    ${record.alerts.length > 0 ? `
                        <div class="perf-alerts">
                            <div class="perf-alerts-title">⚠️ 异常预警（${record.alerts.length}条）</div>
                            ${record.alerts.map(a => `<div class="perf-alert-item"><span class="perf-alert-icon">⚠</span>${a}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="restoreFromHistory(${index})">恢复到当前</button>
                    <button class="btn btn-secondary" onclick="closePerfDetail()">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(detailModal);
        perfLog('viewHistoryDetail 完成');
    } catch (err) {
        perfLogError('viewHistoryDetail 异常', err);
    }
}

function closePerfDetail() {
    perfLog('closePerfDetail 开始');
    try {
        const modal = document.getElementById('perfDetailModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                    perfLog('closePerfDetail: 模态框DOM已删除');
                }
            }, 300);
        } else {
            perfLog('closePerfDetail: 模态框不存在');
        }
    } catch (err) {
        perfLogError('closePerfDetail 异常', err);
    }
}

function restoreFromHistory(index) {
    perfLog('restoreFromHistory 开始', { index });
    try {
        loadPerfHistory();
        const record = perfHistory[index];
        if (!record) {
            perfLogError('restoreFromHistory: 记录不存在', { index, total: perfHistory.length });
            return;
        }
        perfLog('恢复记录', { id: record.id, timestamp: record.timestamp });

        const resultDiv = document.getElementById('perfResult');
        if (!resultDiv) {
            perfLogError('restoreFromHistory: perfResult 元素不存在');
            return;
        }
        resultDiv.innerHTML = `
        <div class="perf-result-content">
            <div class="perf-history-restored">
                <span class="history-restored-icon">📋</span>
                <span>已恢复历史记录（${record.timestamp}）</span>
            </div>
            <div class="perf-metrics">
                <div class="perf-metric-card">
                    <div class="perf-metric-label">平均响应时间</div>
                    <div class="perf-metric-value ${record.metrics.avgResponseTime > 500 ? 'warning' : 'success'}">${record.metrics.avgResponseTime}ms</div>
                </div>
                <div class="perf-metric-card">
                    <div class="perf-metric-label">吞吐量</div>
                    <div class="perf-metric-value success">${record.metrics.throughput}/s</div>
                </div>
                <div class="perf-metric-card">
                    <div class="perf-metric-label">错误率</div>
                    <div class="perf-metric-value ${record.metrics.errorRate > 5 ? 'danger' : record.metrics.errorRate > 2 ? 'warning' : 'success'}">${record.metrics.errorRate}%</div>
                </div>
                <div class="perf-metric-card">
                    <div class="perf-metric-label">并发数</div>
                    <div class="perf-metric-value">${record.metrics.concurrency}</div>
                </div>
                <div class="perf-metric-card">
                    <div class="perf-metric-label">CPU使用率</div>
                    <div class="perf-metric-value ${record.metrics.cpuUsage > 80 ? 'danger' : record.metrics.cpuUsage > 60 ? 'warning' : 'success'}">${record.metrics.cpuUsage}%</div>
                </div>
                <div class="perf-metric-card">
                    <div class="perf-metric-label">内存使用率</div>
                    <div class="perf-metric-value ${record.metrics.memoryUsage > 80 ? 'danger' : record.metrics.memoryUsage > 60 ? 'warning' : 'success'}">${record.metrics.memoryUsage}%</div>
                </div>
            </div>
            <div class="perf-chart">
                <div class="perf-chart-title">响应时间趋势（${record.startTime || '最近1小时'} - ${record.endTime || '现在'}）</div>
                <div class="perf-chart-placeholder">
                    ${generateChartBars(record.metrics.responseTimeSeries)}
                </div>
            </div>
            ${record.alerts.length > 0 ? `
                <div class="perf-alerts">
                    <div class="perf-alerts-title">⚠️ 异常预警（${record.alerts.length}条）</div>
                    ${record.alerts.map(a => `<div class="perf-alert-item"><span class="perf-alert-icon">⚠</span>${a}</div>`).join('')}
                </div>
            ` : ''}
        </div>
    `;

        closePerfDetail();
        showToast('已恢复历史记录到当前页面', 'success');
        perfLog('restoreFromHistory 完成');
    } catch (err) {
        perfLogError('restoreFromHistory 异常', err);
    }
}

function deleteHistoryRecord(index) {
    perfLog('deleteHistoryRecord 开始', { index });
    try {
        loadPerfHistory();
        if (index < 0 || index >= perfHistory.length) {
            perfLogError('deleteHistoryRecord: 索引越界', { index, total: perfHistory.length });
            return;
        }
        perfHistory.splice(index, 1);
        perfLog('记录已删除，剩余数量', perfHistory.length);
        savePerfHistory();
        closePerfHistory();
        showToast('记录已删除', 'success');
        // 重新打开历史记录
        setTimeout(() => viewPerfHistory(), 100);
    } catch (err) {
        perfLogError('deleteHistoryRecord 异常', err);
    }
}

function clearPerfHistory() {
    perfLog('clearPerfHistory 开始');
    try {
        loadPerfHistory();
        if (perfHistory.length === 0) {
            perfLog('clearPerfHistory: 历史记录已为空');
            showToast('历史记录已清空', 'info');
            return;
        }
        perfLog('确认清空，当前记录数', perfHistory.length);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'clearHistoryConfirmModal';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>确认清空</h3>
                    <button class="modal-close" onclick="closeModal('clearHistoryConfirmModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <p>确定要清空所有性能分析历史记录吗？此操作不可恢复。</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('clearHistoryConfirmModal')">取消</button>
                    <button class="btn btn-danger" onclick="confirmClearHistory()">确认清空</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (err) {
        perfLogError('clearPerfHistory 异常', err);
    }
}

function confirmClearHistory() {
    perfLog('confirmClearHistory 开始');
    try {
        perfHistory = [];
        savePerfHistory();
        closeModal('clearHistoryConfirmModal');
        closePerfHistory();
        showToast('历史记录已清空', 'success');
        perfLog('confirmClearHistory 完成');
    } catch (err) {
        perfLogError('confirmClearHistory 异常', err);
    }
}

function generateMockMetrics() {
    perfLog('generateMockMetrics 开始');
    try {
        const metrics = {
            avgResponseTime: Math.floor(Math.random() * 800) + 100,
            throughput: Math.floor(Math.random() * 5000) + 500,
            errorRate: (Math.random() * 10).toFixed(2),
            concurrency: Math.floor(Math.random() * 1000) + 100,
            cpuUsage: Math.floor(Math.random() * 100) + 10,
            memoryUsage: Math.floor(Math.random() * 100) + 20,
            responseTimeSeries: Array.from({length: 12}, () => Math.floor(Math.random() * 800) + 50)
        };
        perfLog('generateMockMetrics 完成', metrics);
        return metrics;
    } catch (err) {
        perfLogError('generateMockMetrics 异常', err);
        return {
            avgResponseTime: 200,
            throughput: 1000,
            errorRate: '1.00',
            concurrency: 500,
            cpuUsage: 50,
            memoryUsage: 60,
            responseTimeSeries: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200]
        };
    }
}

function generateMockAlerts() {
    perfLog('generateMockAlerts 开始');
    try {
        const alerts = [];
        const possibleAlerts = [
            'API /api/users 响应时间超过500ms阈值',
            '数据库查询慢查询检测：orders表索引未优化',
            '缓存命中率低于80%，建议检查缓存策略',
            'CPU使用率在过去10分钟内持续超过80%',
            '检测到5次500错误，集中在支付接口',
            '内存使用量接近上限，建议扩容'
        ];
        const alertCount = Math.floor(Math.random() * 3);
        for (let i = 0; i < alertCount; i++) {
            alerts.push(possibleAlerts[Math.floor(Math.random() * possibleAlerts.length)]);
        }
        perfLog('generateMockAlerts 完成', { count: alerts.length, alerts });
        return alerts;
    } catch (err) {
        perfLogError('generateMockAlerts 异常', err);
        return [];
    }
}

function generateChartBars(data) {
    perfLog('generateChartBars 开始', { dataLength: data ? data.length : 0 });
    try {
        if (!data || data.length === 0) {
            perfLogError('generateChartBars: 数据为空');
            return '';
        }
        const maxVal = Math.max(...data);
        if (maxVal === 0) {
            perfLogError('generateChartBars: 最大值为0');
            return '';
        }
        const bars = data.map((val, i) => {
            const height = (val / maxVal) * 160 + 20;
            return `<div class="perf-bar" style="height: ${height}px;">
                <span class="perf-bar-value">${val}</span>
                <span class="perf-bar-label">${i + 1}h</span>
            </div>`;
        }).join('');
        perfLog('generateChartBars 完成');
        return bars;
    } catch (err) {
        perfLogError('generateChartBars 异常', err);
        return '';
    }
}

function exportReport() {
    perfLog('exportReport 开始');
    try {
        const resultDiv = document.getElementById('perfResult');
        if (!resultDiv) {
            perfLogError('exportReport: perfResult 元素不存在');
            return;
        }
        if (resultDiv.querySelector('.perf-empty-state')) {
            perfLog('exportReport: 无分析结果，已拦截');
            showToast('请先执行性能分析', 'error');
            return;
        }

        const startTime = document.getElementById('perfStartTime')?.value || '';
        const endTime = document.getElementById('perfEndTime')?.value || '';

        // 收集分析结果
        const metricCards = document.querySelectorAll('.perf-metric-card');
        perfLog('exportReport: 找到指标卡片数量', metricCards.length);
        let reportContent = 'AI + 性能分析报告\n';
        reportContent += '====================================\n';
        reportContent += `分析时间: ${new Date().toLocaleString('zh-CN')}\n`;
        reportContent += `时间范围: ${startTime} 至 ${endTime}\n\n`;
        reportContent += '性能指标:\n';

        metricCards.forEach(card => {
            const label = card.querySelector('.perf-metric-label')?.textContent || '';
            const value = card.querySelector('.perf-metric-value')?.textContent || '';
            reportContent += `  ${label}: ${value}\n`;
        });

        // 异常信息
        const alertItems = document.querySelectorAll('.perf-alert-item');
        perfLog('exportReport: 预警条数', alertItems.length);
        if (alertItems.length > 0) {
            reportContent += '\n异常预警:\n';
            alertItems.forEach(item => {
                reportContent += `  - ${item.textContent.replace('⚠', '').trim()}\n`;
            });
        }

        reportContent += '\n报告生成时间: ' + new Date().toLocaleString('zh-CN');

        // 下载报告
        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `perf_report_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        perfLog('exportReport: 报告已下载');
        showToast('报告导出成功', 'success');
    } catch (err) {
        perfLogError('exportReport 异常', err);
        showToast('报告导出失败', 'error');
    }
}

function loadUIAutomationCases() {
    const uiAutoTableBody = document.getElementById('uiAutoTableBody');
    if (!uiAutoTableBody) return;

    const savedTestCases = localStorage.getItem('WT_test_cases');
    
    if (savedTestCases) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(savedTestCases, 'text/html');
        const rows = doc.querySelectorAll('tr');
        
        if (rows.length > 0) {
            let html = '';
            rows.forEach((row, index) => {
                const nameCell = row.querySelector('td:nth-child(3)');
                const name = nameCell ? nameCell.textContent.trim() : `用例 ${index + 1}`;
                html += `
                    <tr>
                        <td><input type="checkbox"></td>
                        <td>${String(index + 1).padStart(2, '0')}</td>
                        <td>${name}</td>
                        <td><span class="agent-tag tag-gray" style="font-size:12px;">待执行</span></td>
                        <td>
                            <a href="javascript:;" class="table-action">查看</a>
                            <a href="javascript:;" class="table-action">删除</a>
                        </td>
                    </tr>
                `;
            });
            uiAutoTableBody.innerHTML = html;
            return;
        }
    }

    const defaultCases = [
        { id: '332', name: '添加收货地址-有效信息添加成功' },
        { id: '333', name: '添加收货地址-无效信息添加失败' },
        { id: '334', name: '删除收货地址-有效操作成功' },
        { id: '335', name: '编辑收货地址-有效操作成功' },
        { id: '341', name: '验证captcha登录成功' },
        { id: '342', name: '验证学生使用手机号注册成功' },
        { id: '349', name: '验证使用微信第三方登录成功' },
        { id: '350', name: '验证使用QQ第三方登录成功' },
        { id: '352', name: '验证正确用户名密码登录成功' },
        { id: '474', name: '百度搜索' },
        { id: '475', name: '验证购物车时输入合法数据可成功保存' }
    ];

    let html = '';
    defaultCases.forEach((tc, index) => {
        html += `
            <tr>
                <td><input type="checkbox"></td>
                <td>${tc.id}</td>
                <td>${tc.name}</td>
                <td><span class="agent-tag tag-gray" style="font-size:12px;">待执行</span></td>
                <td>
                    <a href="javascript:;" class="table-action">查看</a>
                    <a href="javascript:;" class="table-action">删除</a>
                </td>
            </tr>
        `;
    });
    uiAutoTableBody.innerHTML = html;
}

function searchUIAutomation() {
    showToast('查询功能开发中', 'info');
}

function resetUIAutomation() {
    const selects = document.querySelectorAll('.ui-auto-filters .filter-select');
    selects.forEach(select => {
        select.selectedIndex = 0;
    });
    showToast('已重置筛选条件', 'success');
}

function generateUIScript() {
    showToast('AI生成UI脚本功能开发中', 'info');
}

function importUIScript() {
    showToast('导入AI测试脚本功能开发中', 'info');
}

function createTestTask() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'createTestTaskModal';
    modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
                <h3>创建 AI 测试任务</h3>
                <button class="modal-close" onclick="closeModal('createTestTaskModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>任务名称</label>
                    <input type="text" id="testTaskName" placeholder="请输入测试任务名称" style="width:100%;padding:8px 12px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px;outline:none;">
                </div>
                <div class="form-group">
                    <label>测试平台</label>
                    <select id="testTaskPlatform" class="level-select" style="width:100%;padding:8px 12px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px;outline:none;">
                        <option value="web">WEB 网页</option>
                        <option value="mobile">移动应用端</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>测试用例数量</label>
                    <input type="number" id="testTaskCaseCount" placeholder="默认使用全部用例" style="width:100%;padding:8px 12px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px;outline:none;">
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea id="testTaskRemark" placeholder="请输入备注（可选）" rows="3" style="width:100%;padding:8px 12px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px;outline:none;resize:vertical;"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('createTestTaskModal')">取消</button>
                <button class="btn btn-primary" onclick="confirmCreateTestTask()">创建</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmCreateTestTask() {
    const taskName = document.getElementById('testTaskName').value.trim();
    const platform = document.getElementById('testTaskPlatform').value;
    const caseCount = document.getElementById('testTaskCaseCount').value;
    const remark = document.getElementById('testTaskRemark').value.trim();

    if (!taskName) {
        showToast('请输入任务名称', 'error');
        return;
    }

    // 获取测试用例数据
    const tableBody = document.getElementById('uiAutoTableBody');
    const rows = tableBody ? tableBody.querySelectorAll('tr') : [];
    const checkedIds = [];
    rows.forEach(row => {
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb && cb.checked) {
            const idCell = row.querySelector('td:nth-child(2)');
            if (idCell) checkedIds.push(idCell.textContent.trim());
        }
    });

    // 保存测试任务
    const task = {
        id: testTasks.length + 1,
        name: taskName,
        platform: platform,
        caseCount: caseCount || checkedIds.length || 0,
        remark: remark,
        status: '待执行',
        createdAt: new Date().toLocaleString('zh-CN'),
        checkedIds: checkedIds
    };
    testTasks.push(task);
    saveTestTasks();

    closeModal('createTestTaskModal');
    showToast('测试任务创建成功', 'success');
    
    // 如果当前在测试任务执行页面，刷新任务列表
    const execView = document.getElementById('testTaskExecView');
    if (execView && execView.style.display !== 'none') {
        refreshTaskList();
    }
}

function showTestExecRecords() {
    // 先移除旧的弹窗
    const oldModal = document.getElementById('testExecRecordsModal');
    if (oldModal && oldModal.parentNode) {
        oldModal.parentNode.removeChild(oldModal);
    }

    const tasks = testTasks;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'testExecRecordsModal';

    let tableRows = '';
    if (tasks.length === 0) {
        tableRows = '<tr><td colspan="5" style="text-align:center;color:#909399;padding:30px;">暂无测试任务</td></tr>';
    } else {
        tasks.forEach((task, index) => {
            const statusClass = task.status === '已通过' ? 'tag-green' : task.status === '已失败' ? 'tag-red' : task.status === '执行中' ? 'tag-blue' : 'tag-gray';
            const isExecuting = task.status === '执行中';
            const hasReport = task.status === '已通过' || task.status === '已失败';
            
            let actionButtons = `
                <button class="btn btn-primary btn-sm" onclick="executeTestTask(${index})"${isExecuting ? ' disabled' : ''}>${isExecuting ? '执行中...' : '执行'}</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTestTask(${index})">删除</button>
            `;
            
            if (hasReport) {
                actionButtons = `
                    <button class="btn btn-secondary btn-sm" onclick="showTestReport(${index})">查看报告</button>
                    <button class="btn btn-primary btn-sm" onclick="executeTestTask(${index})">重新执行</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTestTask(${index})">删除</button>
                `;
            }
            
            tableRows += `
                <tr>
                    <td>${task.id}</td>
                    <td>${task.name}</td>
                    <td>${task.platform === 'web' ? 'WEB网页' : '移动应用端'}</td>
                    <td><span class="agent-tag ${statusClass}" style="font-size:12px;">${task.status}</span></td>
                    <td>
                        ${actionButtons}
                    </td>
                </tr>
            `;
        });
    }

    modal.innerHTML = `
        <div class="modal" style="max-width: 800px;">
            <div class="modal-header">
                <h3>AI 测试执行记录</h3>
                <button class="modal-close" onclick="closeTestExecModal()">&times;</button>
            </div>
            <div class="modal-body">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f5f7fa;">
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">ID</th>
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">任务名称</th>
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">平台</th>
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">状态</th>
                            <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">操作</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeTestExecModal()">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeTestExecModal() {
    const modal = document.getElementById('testExecRecordsModal');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
}

function executeTestTask(index) {
    if (!testTasks[index]) {
        showToast('任务不存在', 'error');
        return;
    }

    if (testTasks[index].status === '执行中') {
        showToast('任务正在执行中，请稍候', 'info');
        return;
    }

    testTasks[index].status = '执行中';
    saveTestTasks();
    showToast('测试任务开始执行...', 'info');

    // 立即刷新弹窗显示执行中状态
    showTestExecRecords();

    // 模拟执行过程
    setTimeout(function() {
        if (testTasks[index]) {
            testTasks[index].status = '已通过';
            testTasks[index].executedAt = new Date().toLocaleString('zh-CN');
            
            // 生成测试报告数据
            testTasks[index].report = generateTestReport(testTasks[index]);
            
            saveTestTasks();
            showToast('测试任务执行完成', 'success');

            // 刷新记录弹窗
            showTestExecRecords();
        }
    }, 3000);
}

function generateTestReport(task) {
    const caseCount = task.caseCount || 10;
    const passedCount = Math.floor(caseCount * 0.9);
    const failedCount = caseCount - passedCount;
    
    const testCases = [];
    const caseNames = [
        '添加收货地址-有效信息添加成功',
        '添加收货地址-无效信息添加失败',
        '删除收货地址-有效操作成功',
        '编辑收货地址-有效操作成功',
        '验证captcha登录成功',
        '验证学生使用手机号注册成功',
        '验证使用微信第三方登录成功',
        '验证使用QQ第三方登录成功',
        '验证正确用户名密码登录成功',
        '百度搜索',
        '验证购物车时输入合法数据可成功保存',
        '验证商品列表加载成功',
        '验证商品详情页展示正确',
        '验证订单创建成功',
        '验证支付流程正常'
    ];
    
    for (let i = 0; i < caseCount; i++) {
        const isPassed = i < passedCount;
        testCases.push({
            id: String(i + 1).padStart(3, '0'),
            name: caseNames[i % caseNames.length],
            status: isPassed ? '通过' : '失败',
            duration: (Math.random() * 2 + 0.5).toFixed(2) + 's',
            error: isPassed ? '' : '断言失败：期望结果与实际结果不一致'
        });
    }
    
    return {
        summary: {
            taskName: task.name,
            platform: task.platform === 'web' ? 'WEB 网页' : '移动应用端',
            totalCases: caseCount,
            passedCount: passedCount,
            failedCount: failedCount,
            passRate: ((passedCount / caseCount) * 100).toFixed(1) + '%',
            startTime: task.createdAt,
            endTime: new Date().toLocaleString('zh-CN'),
            duration: '3.00s'
        },
        cases: testCases
    };
}

function showTestReport(index) {
    const task = testTasks[index];
    if (!task || !task.report) {
        showToast('测试报告不存在', 'error');
        return;
    }
    
    const report = task.report;
    
    let casesTableRows = '';
    report.cases.forEach(tc => {
        const statusColor = tc.status === '通过' ? '#67c23a' : '#f56c6c';
        casesTableRows += `
            <tr>
                <td>${tc.id}</td>
                <td>${tc.name}</td>
                <td><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;color:white;background:${statusColor};">${tc.status}</span></td>
                <td>${tc.duration}</td>
                <td>${tc.error || '-'}</td>
            </tr>
        `;
    });
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'testReportModal';
    modal.innerHTML = `
        <div class="modal" style="max-width: 900px;">
            <div class="modal-header">
                <h3>测试报告 - ${task.name}</h3>
                <button class="modal-close" onclick="closeModal('testReportModal')">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #409eff;">${report.summary.totalCases}</div>
                        <div style="font-size: 13px; color: #606266; margin-top: 4px;">总用例数</div>
                    </div>
                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #67c23a;">${report.summary.passedCount}</div>
                        <div style="font-size: 13px; color: #606266; margin-top: 4px;">通过</div>
                    </div>
                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #f56c6c;">${report.summary.failedCount}</div>
                        <div style="font-size: 13px; color: #606266; margin-top: 4px;">失败</div>
                    </div>
                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #e6a23c;">${report.summary.passRate}</div>
                        <div style="font-size: 13px; color: #606266; margin-top: 4px;">通过率</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px; padding: 16px; background: #f5f7fa; border-radius: 8px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 24px; font-size: 13px; color: #606266;">
                        <div><strong>测试平台：</strong>${report.summary.platform}</div>
                        <div><strong>开始时间：</strong>${report.summary.startTime}</div>
                        <div><strong>结束时间：</strong>${report.summary.endTime}</div>
                        <div><strong>执行时长：</strong>${report.summary.duration}</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="font-size: 14px; font-weight: 500; color: #303133; margin-bottom: 12px;">用例详情</h4>
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f5f7fa;">
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;width:80px;">ID</th>
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">用例名称</th>
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;width:80px;">状态</th>
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;width:80px;">耗时</th>
                                <th style="padding:10px;border-bottom:1px solid #ebeef5;text-align:left;">错误信息</th>
                            </tr>
                        </thead>
                        <tbody>${casesTableRows}</tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('testReportModal')">关闭</button>
                <button class="btn btn-primary" onclick="downloadTestReport(${index})">下载报告</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function downloadTestReport(index) {
    const task = testTasks[index];
    if (!task || !task.report) {
        showToast('测试报告不存在', 'error');
        return;
    }
    
    const report = task.report;
    let csvContent = 'ID,用例名称,状态,耗时,错误信息\n';
    report.cases.forEach(tc => {
        csvContent += `${tc.id},"${tc.name}",${tc.status},${tc.duration},"${tc.error || ''}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${task.name}_测试报告_${report.summary.endTime.replace(/[/:\s]/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('测试报告已下载', 'success');
}

function deleteTestTask(index) {
    testTasks.splice(index, 1);
    saveTestTasks();
    showToast('测试任务已删除', 'success');
    refreshTaskList();
}

function showTestExecRecords() {
    document.getElementById('uiAutomationView').style.display = 'none';
    document.getElementById('testTaskExecView').style.display = 'block';
    localStorage.setItem('WT_current_view', 'testTaskExecView');
    refreshTaskList();
}

function backToUIAutomation() {
    document.getElementById('testTaskExecView').style.display = 'none';
    document.getElementById('uiAutomationView').style.display = 'block';
    localStorage.setItem('WT_current_view', 'uiAutomationView');
}

function refreshTaskList() {
    const tasks = testTasks;
    const tableBody = document.getElementById('testTaskTableBody');
    const taskTotal = document.getElementById('taskTotal');

    if (taskTotal) taskTotal.textContent = tasks.length;

    if (tasks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #909399; padding: 40px;">暂无数据</td></tr>';
        return;
    }

    let tableRows = '';
    tasks.forEach((task, index) => {
        const statusClass = task.status === '已通过' ? 'tag-green' : task.status === '已失败' ? 'tag-red' : task.status === '执行中' ? 'tag-blue' : 'tag-gray';
        const isExecuting = task.status === '执行中';
        const hasReport = task.status === '已通过' || task.status === '已失败';
        
        let actionButtons = `
            <button class="btn btn-primary btn-sm" onclick="executeTestTask(${index})"${isExecuting ? ' disabled' : ''}>${isExecuting ? '执行中...' : '执行'}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteTestTask(${index})">删除</button>
        `;
        
        if (hasReport) {
            actionButtons = `
                <button class="btn btn-secondary btn-sm" onclick="showTestReport(${index})">查看报告</button>
                <button class="btn btn-primary btn-sm" onclick="executeTestTask(${index})">重新执行</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTestTask(${index})">删除</button>
            `;
        }
        
        tableRows += `
            <tr>
                <td><input type="checkbox" class="task-checkbox" data-index="${index}"></td>
                <td>${task.id}</td>
                <td>${task.createdAt || '-'}</td>
                <td><span class="agent-tag ${statusClass}" style="font-size:12px;">${task.status}</span></td>
                <td>${task.name}</td>
                <td>
                    ${actionButtons}
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = tableRows;
}

function handleRefresh() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (!refreshBtn) return;
    
    const originalText = refreshBtn.textContent;
    refreshBtn.textContent = '加载中...';
    refreshBtn.disabled = true;
    
    setTimeout(async function() {
        await loadTestTasks();
        refreshTaskList();
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
        showToast('已刷新', 'success');
    }, 800);
}

function handleBatchDelete() {
    const checkboxes = document.querySelectorAll('.task-checkbox:checked');
    if (checkboxes.length === 0) {
        showToast('请选择要删除的任务', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'confirmDeleteModal';
    modal.innerHTML = `
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3>确认删除</h3>
                <button class="modal-close" onclick="closeModal('confirmDeleteModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color: #606266; font-size: 14px;">是否删除选中的 ${checkboxes.length} 项？</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('confirmDeleteModal')">取消</button>
                <button class="btn btn-danger" onclick="confirmBatchDelete()">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmBatchDelete() {
    closeModal('confirmDeleteModal');
    
    const checkboxes = document.querySelectorAll('.task-checkbox:checked');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
    
    selectedIndices.sort((a, b) => b - a);
    selectedIndices.forEach(index => {
        testTasks.splice(index, 1);
    });
    
    saveTestTasks();
    showToast(`已删除 ${checkboxes.length} 个任务`, 'success');
    refreshTaskList();
    
    document.getElementById('selectAllTasks').checked = false;
}

function toggleSelectAllTasks(checkbox) {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
}

function batchDeleteTasks() {
    const checkboxes = document.querySelectorAll('.task-checkbox:checked');
    if (checkboxes.length === 0) {
        showToast('请选择要删除的任务', 'error');
        return;
    }

    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
    
    selectedIndices.sort((a, b) => b - a);
    selectedIndices.forEach(index => {
        testTasks.splice(index, 1);
    });

    saveTestTasks();
    showToast(`已删除 ${checkboxes.length} 个任务`, 'success');
    refreshTaskList();

    document.getElementById('selectAllTasks').checked = false;
}

function prevPage() {
    showToast('上一页功能开发中', 'info');
}

function nextPage() {
    showToast('下一页功能开发中', 'info');
}

function generateTestCase() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'generateTestCaseModal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>AI生成测试用例</h3>
                <button class="modal-close" onclick="closeModal('generateTestCaseModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="import-section">
                    <label class="import-label">测试用例类型</label>
                    <select id="testCaseType" class="level-select">
                        <option value="unit">单元测试</option>
                        <option value="integration">集成测试</option>
                        <option value="api">接口测试</option>
                        <option value="ui">UI测试</option>
                    </select>
                </div>
                <div class="import-section">
                    <label class="import-label">优先级配置</label>
                    <div class="checkbox-group">
                        <input type="checkbox" id="priorityHigh" checked>
                        <label for="priorityHigh">高优先级</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="priorityMedium" checked>
                        <label for="priorityMedium">中优先级</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="priorityLow">
                        <label for="priorityLow">低优先级</label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('generateTestCaseModal')">取消</button>
                <button class="btn btn-primary" onclick="confirmGenerateTestCase()">开始生成</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmGenerateTestCase() {
    const modal = document.getElementById('generateTestCaseModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    
    const tableBody = document.getElementById('apiCaseTableBody') || document.getElementById('testCaseTableBody');
    tableBody.innerHTML = '';
    
    const testCases = [
        { id: '01', name: '登录接口-正常登录', priority: '高' },
        { id: '02', name: '登录接口-用户名为空', priority: '高' },
        { id: '03', name: '登录接口-密码为空', priority: '高' },
        { id: '04', name: '登录接口-用户名错误', priority: '中' },
        { id: '05', name: '登录接口-密码错误', priority: '中' },
        { id: '06', name: '登录接口-账号已锁定', priority: '中' },
        { id: '07', name: '登录接口-请求超时', priority: '低' },
        { id: '08', name: '登录接口-并发登录', priority: '低' }
    ];
    
    let html = '';
    testCases.forEach((tc, index) => {
        html += `
            <tr>
                <td><input type="checkbox"></td>
                <td>${String(index + 1).padStart(2, '0')}</td>
                <td>${tc.name}</td>
                <td>${tc.priority}</td>
                <td>
                    <a href="javascript:;" class="table-action" onclick="editTestCase('${tc.id}')">编辑</a>
                    <a href="javascript:;" class="table-action" onclick="removeTestCase(this)">删除</a>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    localStorage.setItem('WT_test_cases', html);
    
    const totalSpan = document.getElementById('caseTotal');
    if (totalSpan) totalSpan.textContent = `共 ${testCases.length} 条`;
    
    showToast('测试用例生成成功', 'success');
}

function addTestCase() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'addTestCaseModal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>手动添加测试用例</h3>
                <button class="modal-close" onclick="closeModal('addTestCaseModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="import-section">
                    <label class="import-label">用例名称</label>
                    <input type="text" id="newTestCaseName" class="level-select" placeholder="请输入用例名称" required>
                </div>
                <div class="import-section">
                    <label class="import-label">优先级</label>
                    <select id="newTestCasePriority" class="level-select">
                        <option value="高">高</option>
                        <option value="中">中</option>
                        <option value="低">低</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('addTestCaseModal')">取消</button>
                <button class="btn btn-primary" onclick="confirmAddTestCase()">添加</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmAddTestCase() {
    const name = document.getElementById('newTestCaseName').value;
    const priority = document.getElementById('newTestCasePriority').value;
    
    if (!name.trim()) {
        showToast('请输入用例名称', 'error');
        return;
    }
    
    const tableBody = document.getElementById('apiCaseTableBody') || document.getElementById('testCaseTableBody');
    const rows = tableBody.querySelectorAll('tr');
    const newId = String(rows.length + 1).padStart(2, '0');
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="checkbox"></td>
        <td>${newId}</td>
        <td>${name}</td>
        <td>${priority}</td>
        <td>
            <a href="javascript:;" class="table-action" onclick="editTestCase('${newId}')">编辑</a>
            <a href="javascript:;" class="table-action" onclick="removeTestCase(this)">删除</a>
        </td>
    `;
    tableBody.appendChild(newRow);
    localStorage.setItem('WT_test_cases', tableBody.innerHTML);
    
    const totalSpan = document.getElementById('caseTotal');
    if (totalSpan) {
        const totalRows = tableBody.querySelectorAll('tr').length;
        totalSpan.textContent = `共 ${totalRows} 条`;
    }
    
    const modal = document.getElementById('addTestCaseModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    
    showToast('测试用例添加成功', 'success');
}

function deleteTestCase() {
    const tableBody = document.getElementById('apiCaseTableBody') || document.getElementById('testCaseTableBody');
    const checkedBoxes = tableBody.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedBoxes.length === 0) {
        showToast('请先选择要删除的测试用例', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'deleteTestCaseModal';
    modal.innerHTML = `
        <div class="modal modal-small">
            <div class="modal-header">
                <h3>确认删除</h3>
                <button class="modal-close" onclick="closeModal('deleteTestCaseModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>确认删除选中的 ${checkedBoxes.length} 条测试用例吗？</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deleteTestCaseModal')">取消</button>
                <button class="btn btn-danger" onclick="confirmDeleteTestCase()">确认删除</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmDeleteTestCase() {
    const tableBody = document.getElementById('apiCaseTableBody') || document.getElementById('testCaseTableBody');
    const checkedBoxes = tableBody.querySelectorAll('input[type="checkbox"]:checked');
    checkedBoxes.forEach(box => {
        box.closest('tr').remove();
    });
    
    const modal = document.getElementById('deleteTestCaseModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    
    localStorage.setItem('WT_test_cases', tableBody.innerHTML);
    
    const totalSpan = document.getElementById('caseTotal');
    if (totalSpan) {
        const totalRows = tableBody.querySelectorAll('tr').length;
        totalSpan.textContent = `共 ${totalRows} 条`;
    }
    
    showToast('测试用例删除成功', 'success');
}

function importTestCase() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'importTestCaseModal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>导入测试用例</h3>
                <button class="modal-close" onclick="closeModal('importTestCaseModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="import-section">
                    <label class="import-label">选择文件</label>
                    <div class="upload-area-large" id="uploadTestCaseArea">
                        <div class="upload-cloud-icon">☁️</div>
                        <p class="upload-text-large">拖拽文件到此处或 <span class="upload-link" onclick="document.getElementById('testCaseFileInput').click()">点击上传</span></p>
                        <input type="file" id="testCaseFileInput" accept=".xlsx,.csv,.json" style="display: none;">
                    </div>
                    <p class="upload-hint-large">支持格式：Excel(.xlsx)、CSV(.csv)、JSON(.json)</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('importTestCaseModal')">取消</button>
                <button class="btn btn-primary" onclick="confirmImportTestCase()">导入</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmImportTestCase() {
    const modal = document.getElementById('importTestCaseModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    showToast('测试用例导入功能开发中', 'info');
}

function editTestCase(id) {
    showToast('编辑测试用例功能开发中', 'info');
}

function removeTestCase(element) {
    const row = element.closest('tr');
    const name = row.querySelector('td:nth-child(3)').textContent;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'removeTestCaseModal';
    modal.innerHTML = `
        <div class="modal modal-small">
            <div class="modal-header">
                <h3>确认删除</h3>
                <button class="modal-close" onclick="closeModal('removeTestCaseModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>确认删除测试用例 "${name}" 吗？</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('removeTestCaseModal')">取消</button>
                <button class="btn btn-danger" onclick="confirmRemoveTestCase('${row.rowIndex}')">确认删除</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmRemoveTestCase(rowIndex) {
    const tableBody = document.getElementById('testCaseTableBody');
    const rows = tableBody.querySelectorAll('tr');
    rows[rowIndex - 1].remove();
    
    // 保存更新后的测试用例
    localStorage.setItem('WT_test_cases', tableBody.innerHTML);
    
    const modal = document.getElementById('removeTestCaseModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    
    showToast('测试用例删除成功', 'success');
}

function exitProject() {
    currentProjectId = null;
    document.getElementById('projectGrid').parentElement.style.display = 'block';
    document.getElementById('agentView').style.display = 'none';
    document.getElementById('apiDocView').style.display = 'none';
    document.getElementById('testCaseView').style.display = 'none';
    document.getElementById('uiAutomationView').style.display = 'none';
    document.getElementById('btnExitProject').style.display = 'none';
    document.getElementById('headerTitle').textContent = 'AI+项目中心';
    localStorage.removeItem('WT_current_project_id');
    localStorage.removeItem('WT_current_view');
    localStorage.removeItem('WT_test_cases');
}

function showApiDocAnalysis() {
    document.getElementById('agentView').style.display = 'none';
    document.getElementById('apiDocView').style.display = 'block';
    localStorage.setItem('WT_current_view', 'apiDocView');
    
    // 重置状态：隐藏右侧内容区和顶部按钮
    const docMain = document.getElementById('docMain');
    const apiDocActions = document.getElementById('apiDocActions');
    const docEditor = document.getElementById('docEditor');
    
    if (docMain) {
        docMain.style.display = 'none';
    }
    if (apiDocActions) {
        apiDocActions.style.display = 'none';
    }
    if (docEditor) {
        docEditor.innerHTML = '<!-- 导入文档后显示内容 -->';
    }
}

function backToAgent() {
    document.getElementById('apiDocView').style.display = 'none';
    document.getElementById('testCaseView').style.display = 'none';
    document.getElementById('uiAutomationView').style.display = 'none';
    document.getElementById('testTaskExecView').style.display = 'none';
    document.getElementById('apiAutoView').style.display = 'none';
    document.getElementById('dataGenerateView').style.display = 'none';
    document.getElementById('performanceAnalysisView').style.display = 'none';
    document.getElementById('agentView').style.display = 'block';
    localStorage.setItem('WT_current_view', 'agentView');
    uploadedFile = null;
    
    const uploadedFiles = document.getElementById('uploadedFiles');
    if (uploadedFiles) uploadedFiles.innerHTML = '';
    
    const reviewSection = document.getElementById('reviewSection');
    if (reviewSection) reviewSection.style.display = 'none';
    
    const reviewResults = document.getElementById('reviewResults');
    if (reviewResults) reviewResults.innerHTML = '';
}

function setupUploadArea() {
    const uploadArea = document.getElementById('uploadAreaLarge');
    const fileInput = document.getElementById('fileInputLarge');
    
    if (!uploadArea || !fileInput) return;
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#4a90d9';
        uploadArea.style.background = 'rgba(74, 144, 217, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#e0e0e0';
        uploadArea.style.background = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e0e0e0';
        uploadArea.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

function handleFileUpload(file) {
    if (!file.name.endsWith('.md')) {
        showToast('请上传 Markdown 格式的文件', 'error');
        return;
    }
    
    uploadedFile = file;
    const uploadedFilesDiv = document.getElementById('uploadedFiles');
    uploadedFilesDiv.innerHTML = `
        <div class="uploaded-file">
            <span class="uploaded-file-name">📄 ${escapeHtml(file.name)}</span>
            <button class="btn-review" onclick="startAiReview()">AI 接口评审</button>
        </div>
    `;
    
    showToast('文档导入成功', 'success');
}

function startAiReview() {
    if (!uploadedFile) {
        showToast('请先导入接口文档', 'error');
        return;
    }
    
    const reviewSection = document.getElementById('reviewSection');
    const reviewStatus = document.getElementById('reviewStatus');
    
    reviewSection.style.display = 'block';
    reviewStatus.className = 'review-status processing';
    reviewStatus.innerHTML = '<p>⏳ AI 正在处理文档，请稍候...</p>';
    document.getElementById('reviewResults').innerHTML = '';
    
    setTimeout(() => {
        reviewStatus.className = 'review-status complete';
        reviewStatus.innerHTML = '<p>✅ AI 文档评审完成</p>';
        
        reviewResults = [
            {
                id: 1,
                title: '接口参数校验建议',
                desc: '建议对所有必填参数添加非空校验，对数值类型参数添加范围校验'
            },
            {
                id: 2,
                title: '错误码规范建议',
                desc: '建议统一错误码格式，区分业务错误和系统错误'
            },
            {
                id: 3,
                title: '接口幂等性建议',
                desc: '对于创建类接口，建议添加幂等性控制，防止重复提交'
            },
            {
                id: 4,
                title: '分页参数建议',
                desc: '列表接口建议统一使用 page/pageSize 或 offset/limit 分页参数'
            },
            {
                id: 5,
                title: '响应格式建议',
                desc: '建议统一响应格式，包含 code、message、data 三个字段'
            }
        ];
        
        renderReviewResults();
    }, 2000);
}

function renderReviewResults() {
    const resultsDiv = document.getElementById('reviewResults');
    let html = '<h4 style="margin-bottom: 12px;">评审建议（请选择适用的建议）</h4>';
    
    reviewResults.forEach(result => {
        html += `
            <div class="review-item">
                <input type="checkbox" id="review-${result.id}" value="${result.id}">
                <div class="review-item-content">
                    <div class="review-item-title">${escapeHtml(result.title)}</div>
                    <div class="review-item-desc">${escapeHtml(result.desc)}</div>
                </div>
            </div>
        `;
    });
    
    html += '<button class="btn-save" onclick="saveReviewResults()">保存</button>';
    resultsDiv.innerHTML = html;
}

function saveReviewResults() {
    const checkboxes = document.querySelectorAll('.review-item input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (selectedIds.length === 0) {
        showToast('请至少选择一条评审建议', 'error');
        return;
    }
    
    const selectedResults = reviewResults.filter(r => selectedIds.includes(r.id));
    console.log('保存的评审建议：', selectedResults);
    
    showToast(`已保存 ${selectedResults.length} 条评审建议`, 'success');
}

function showToast(message, type) {
    const existing = document.querySelector('.toast');
    if (existing) {
        existing.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function addRootDirectory() {
    document.getElementById('directoryName').value = '';
    showModal('addDirectoryModal');
}

function confirmAddDirectory() {
    const name = document.getElementById('directoryName').value.trim();
    if (!name) {
        showToast('请输入目录名称', 'error');
        return;
    }
    
    const docTree = document.querySelector('.doc-tree');
    if (!docTree) return;
    
    const newItem = document.createElement('div');
    newItem.className = 'tree-item';
    newItem.innerHTML = `
        <input type="checkbox" class="tree-checkbox">
        <span class="tree-label">${escapeHtml(name)}</span>
        <div class="tree-actions">
            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
        </div>
    `;
    docTree.appendChild(newItem);
    closeModal('addDirectoryModal');
    showToast('根目录添加成功', 'success');
}

function importDocument() {
    document.getElementById('importDocumentModal').classList.add('active');
    setupLargeUploadArea();
}

function setupLargeUploadArea() {
    const uploadArea = document.getElementById('uploadAreaLarge');
    const fileInput = document.getElementById('fileInputLarge');
    const fileSelected = document.getElementById('fileSelected');
    const selectedFileName = document.getElementById('selectedFileName');
    
    if (!uploadArea || !fileInput) return;
    
    // Reset state
    uploadArea.style.display = 'block';
    fileSelected.style.display = 'none';
    
    uploadArea.onclick = (e) => {
        if (e.target.classList.contains('upload-link')) return;
        fileInput.click();
    };
    
    uploadArea.ondragover = (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#409eff';
        uploadArea.style.background = 'rgba(64, 158, 255, 0.1)';
    };
    
    uploadArea.ondragleave = () => {
        uploadArea.style.borderColor = '#dcdfe6';
        uploadArea.style.background = '#fafafa';
    };
    
    uploadArea.ondrop = (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#dcdfe6';
        uploadArea.style.background = '#fafafa';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleLargeFileSelect(files[0]);
        }
    };
    
    fileInput.onchange = () => {
        if (fileInput.files.length > 0) {
            handleLargeFileSelect(fileInput.files[0]);
        }
    };
}

function handleLargeFileSelect(file) {
    const uploadArea = document.getElementById('uploadAreaLarge');
    const fileSelected = document.getElementById('fileSelected');
    const selectedFileName = document.getElementById('selectedFileName');
    
    // Keep upload area visible, show file name below it
    fileSelected.style.display = 'flex';
    selectedFileName.textContent = file.name;
}

// 存储各节点的文档内容
const documentContents = {
    '文档介绍': `
        <div class="doc-section">
            <h3>文档介绍</h3>
        </div>
        <div class="doc-section">
            <h4>编写目的</h4>
            <p>本文档旨在明确系统功能需求，为开发团队提供清晰的功能实现指导，确保系统开发符合预期目标。</p>
        </div>
        <div class="doc-section">
            <h4>文档范围</h4>
            <p>本文档涵盖系统的所有功能模块，包括用户管理、权限控制、数据处理等核心功能。</p>
        </div>
        <div class="doc-section">
            <h4>读者对象</h4>
            <p>本文档适用于项目经理、开发团队、测试团队及相关利益相关者。</p>
        </div>
        <div class="doc-section">
            <h4>术语与缩写解释</h4>
            <ul>
                <li>API：应用程序编程接口</li>
                <li>UI：用户界面</li>
                <li>UX：用户体验</li>
            </ul>
        </div>
    `,
    '项目介绍': `
        <div class="doc-section">
            <h3>项目介绍</h3>
        </div>
        <div class="doc-section">
            <h4>项目说明</h4>
            <p>本项目旨在开发一套智能化的测试管理平台，通过AI技术提升测试效率和质量。</p>
        </div>
        <div class="doc-section">
            <h4>项目背景</h4>
            <p>随着软件系统复杂度不断提升，传统测试方法已无法满足快速迭代的需求，需要引入智能化测试手段。</p>
        </div>
        <div class="doc-section">
            <h4>项目目标</h4>
            <ul>
                <li>提升测试效率50%以上</li>
                <li>降低人工测试成本</li>
                <li>提高测试覆盖率</li>
            </ul>
        </div>
        <div class="doc-section">
            <h4>项目用户</h4>
            <p>主要用户群体包括测试工程师、开发工程师、项目经理等。</p>
        </div>
    `,
    '功能性需求': `
        <div class="doc-section">
            <h3>功能性需求</h3>
        </div>
        <div class="doc-section">
            <h4>系统登录功能</h4>
        </div>
        <div class="doc-section">
            <h5>功能概述</h5>
            <ul>
                <li>功能描述：实现用户登录和登出功能，提供用户名/密码认证方式，确保系统访问安全。用户需输入正确的账号密码才能进入系统。</li>
                <li>功能入口：系统首页直接显示登录入口，支持快速登录操作。</li>
            </ul>
            <div class="doc-preview">
                <h5>界面原型</h5>
                <div class="preview-mockup">
                    <div class="mockup-input">
                        <span class="input-icon"></span>
                        <span class="input-placeholder">请输入用户名</span>
                    </div>
                    <div class="mockup-input">
                        <span class="input-icon"></span>
                        <span class="input-placeholder">请输入密码</span>
                        <span class="input-eye"></span>
                    </div>
                    <div class="mockup-link">忘记密码？</div>
                    <button class="mockup-btn">登录</button>
                </div>
            </div>
        </div>
        <div class="doc-section">
            <h5>数据字段描述</h5>
            <ul>
                <li>用户名输入框：用于输入注册时绑定的用户名或手机号/邮箱</li>
                <li>密码输入框：用于输入账户对应的密码，需密文显示</li>
                <li>登录按钮：点击后提交用户输入信息进行验证</li>
            </ul>
        </div>
        <div class="doc-section">
            <h5>用户操作描述</h5>
            <ul>
                <li>从首页进入登录页</li>
                <li>打开浏览器进入首页</li>
                <li>在用户名输入框中输入对应的用户名/手机号</li>
                <li>在密码输入框中输入对应的密码</li>
                <li>点击登录按钮提交信息</li>
                <li>系统验证用户输入信息是否符合校验规则</li>
                <li>显示校验结果</li>
                <li>输入用户名/密码信息后点击提交登录</li>
                <li>系统验证用户信息</li>
            </ul>
        </div>
    `,
    '系统登录功能': `
        <div class="doc-section">
            <h4>系统登录功能</h4>
        </div>
        <div class="doc-section">
            <h5>功能概述</h5>
            <ul>
                <li>功能描述：实现用户登录和登出功能，提供用户名/密码认证方式，确保系统访问安全。用户需输入正确的账号密码才能进入系统。</li>
                <li>功能入口：系统首页直接显示登录入口，支持快速登录操作。</li>
            </ul>
            <div class="doc-preview">
                <h5>界面原型</h5>
                <div class="preview-mockup">
                    <div class="mockup-input">
                        <span class="input-icon"></span>
                        <span class="input-placeholder">请输入用户名</span>
                    </div>
                    <div class="mockup-input">
                        <span class="input-icon"></span>
                        <span class="input-placeholder">请输入密码</span>
                        <span class="input-eye"></span>
                    </div>
                    <div class="mockup-link">忘记密码？</div>
                    <button class="mockup-btn">登录</button>
                </div>
            </div>
        </div>
        <div class="doc-section">
            <h5>数据字段描述</h5>
            <ul>
                <li>用户名输入框：用于输入注册时绑定的用户名或手机号/邮箱</li>
                <li>密码输入框：用于输入账户对应的密码，需密文显示</li>
                <li>登录按钮：点击后提交用户输入信息进行验证</li>
            </ul>
        </div>
        <div class="doc-section">
            <h5>用户操作描述</h5>
            <ul>
                <li>从首页进入登录页</li>
                <li>打开浏览器进入首页</li>
                <li>在用户名输入框中输入对应的用户名/手机号</li>
                <li>在密码输入框中输入对应的密码</li>
                <li>点击登录按钮提交信息</li>
                <li>系统验证用户输入信息是否符合校验规则</li>
                <li>显示校验结果</li>
                <li>输入用户名/密码信息后点击提交登录</li>
                <li>系统验证用户信息</li>
            </ul>
        </div>
    `,
    '系统主页': `
        <div class="doc-section">
            <h4>系统主页</h4>
        </div>
        <div class="doc-section">
            <h5>功能概述</h5>
            <p>系统主页是用户登录后的默认页面，展示系统核心功能入口和关键数据概览。</p>
        </div>
        <div class="doc-section">
            <h5>界面原型</h5>
            <div class="preview-mockup">
                <div class="mockup-header">系统主页</div>
                <div class="mockup-content">
                    <div class="mockup-card">功能模块1</div>
                    <div class="mockup-card">功能模块2</div>
                    <div class="mockup-card">功能模块3</div>
                </div>
            </div>
        </div>
    `,
    '房产管理功能': `
        <div class="doc-section">
            <h4>房产管理功能</h4>
        </div>
        <div class="doc-section">
            <h5>功能概述</h5>
            <p>提供房产信息的增删改查功能，支持房产分类管理和详细信息展示。</p>
        </div>
        <div class="doc-section">
            <h5>数据字段描述</h5>
            <ul>
                <li>房产名称：房产的唯一标识名称</li>
                <li>房产地址：房产的详细地址信息</li>
                <li>房产类型：住宅/商业/办公等</li>
                <li>建筑面积：房产的建筑面积（平方米）</li>
            </ul>
        </div>
    `,
    '房间管理功能': `
        <div class="doc-section">
            <h4>房间管理功能</h4>
        </div>
        <div class="doc-section">
            <h5>功能概述</h5>
            <p>提供房间信息的增删改查功能，支持房间与房产的关联管理。</p>
        </div>
        <div class="doc-section">
            <h5>数据字段描述</h5>
            <ul>
                <li>房间编号：房间的唯一标识</li>
                <li>房间名称：房间的名称</li>
                <li>所属房产：房间所属的房产</li>
                <li>房间面积：房间的使用面积（平方米）</li>
                <li>房间状态：空闲/已占用/维修中</li>
            </ul>
        </div>
    `,
    '功能概述': `
        <div class="doc-section">
            <h5>功能概述</h5>
            <ul>
                <li>功能描述：实现用户登录和登出功能，提供用户名/密码认证方式，确保系统访问安全。用户需输入正确的账号密码才能进入系统。</li>
                <li>功能入口：系统首页直接显示登录入口，支持快速登录操作。</li>
            </ul>
            <div class="doc-preview">
                <h5>界面原型</h5>
                <div class="preview-mockup">
                    <div class="mockup-input">
                        <span class="input-icon"></span>
                        <span class="input-placeholder">请输入用户名</span>
                    </div>
                    <div class="mockup-input">
                        <span class="input-icon"></span>
                        <span class="input-placeholder">请输入密码</span>
                        <span class="input-eye"></span>
                    </div>
                    <div class="mockup-link">忘记密码？</div>
                    <button class="mockup-btn">登录</button>
                </div>
            </div>
        </div>
    `
};

function confirmImportDocument() {
    const fileInput = document.getElementById('fileInputLarge');
    const level = document.getElementById('requirementLevel').value;
    
    if (!fileInput.files.length) {
        showToast('请先选择文件', 'error');
        return;
    }
    
    const docMain = document.getElementById('docMain');
    const apiDocActions = document.getElementById('apiDocActions');
    const docEditor = document.getElementById('docEditor');
    const docTree = document.getElementById('docTree');
    
    // Show content area
    if (docMain) {
        docMain.style.display = 'flex';
    }
    if (apiDocActions) {
        apiDocActions.style.display = 'flex';
    }
    
    // Build document tree based on level selection
    if (docTree) {
        let treeHTML = '';
        if (level === '2') {
            // 二级标题作为需求标题
            treeHTML = `
                <div class="tree-item tree-parent">
                    <span class="tree-toggle" onclick="toggleTree(this)">▼</span>
                    <input type="checkbox" class="tree-checkbox">
                    <span class="tree-label" onclick="showDocumentContent('文档介绍')">文档介绍</span>
                    <div class="tree-actions">
                        <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                        <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                        <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                    </div>
                </div>
                <div class="tree-children">
                    <div class="tree-item">
                        <input type="checkbox" class="tree-checkbox">
                        <span class="tree-label" onclick="showDocumentContent('编写目的')">编写目的</span>
                        <div class="tree-actions">
                            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                        </div>
                    </div>
                    <div class="tree-item">
                        <input type="checkbox" class="tree-checkbox">
                        <span class="tree-label" onclick="showDocumentContent('文档范围')">文档范围</span>
                        <div class="tree-actions">
                            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                        </div>
                    </div>
                </div>
                <div class="tree-item tree-parent">
                    <span class="tree-toggle" onclick="toggleTree(this)">▼</span>
                    <input type="checkbox" class="tree-checkbox">
                    <span class="tree-label" onclick="showDocumentContent('项目介绍')">项目介绍</span>
                    <div class="tree-actions">
                        <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                        <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                        <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                    </div>
                </div>
                <div class="tree-children">
                    <div class="tree-item">
                        <input type="checkbox" class="tree-checkbox">
                        <span class="tree-label" onclick="showDocumentContent('项目说明')">项目说明</span>
                        <div class="tree-actions">
                            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                        </div>
                    </div>
                    <div class="tree-item">
                        <input type="checkbox" class="tree-checkbox">
                        <span class="tree-label" onclick="showDocumentContent('项目背景')">项目背景</span>
                        <div class="tree-actions">
                            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                        </div>
                    </div>
                </div>
                <div class="tree-item tree-parent">
                    <span class="tree-toggle" onclick="toggleTree(this)">▼</span>
                    <input type="checkbox" class="tree-checkbox">
                    <span class="tree-label" onclick="showDocumentContent('功能性需求')">功能性需求</span>
                    <div class="tree-actions">
                        <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                        <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                        <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                    </div>
                </div>
                <div class="tree-children">
                    <div class="tree-item">
                        <input type="checkbox" class="tree-checkbox">
                        <span class="tree-label" onclick="showDocumentContent('系统登录功能')">系统登录功能</span>
                        <div class="tree-actions">
                            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                        </div>
                    </div>
                    <div class="tree-item">
                        <input type="checkbox" class="tree-checkbox">
                        <span class="tree-label" onclick="showDocumentContent('系统主页')">系统主页</span>
                        <div class="tree-actions">
                            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                        </div>
                    </div>
                    <div class="tree-item">
                        <input type="checkbox" class="tree-checkbox">
                        <span class="tree-label" onclick="showDocumentContent('房产管理功能')">房产管理功能</span>
                        <div class="tree-actions">
                            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                        </div>
                    </div>
                    <div class="tree-item">
                        <input type="checkbox" class="tree-checkbox">
                        <span class="tree-label" onclick="showDocumentContent('房间管理功能')">房间管理功能</span>
                        <div class="tree-actions">
                            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                        </div>
                    </div>
                </div>
            `;
        } else if (level === '1') {
            treeHTML = `
                <div class="tree-item tree-parent">
                    <span class="tree-toggle" onclick="toggleTree(this)">▼</span>
                    <input type="checkbox" class="tree-checkbox">
                    <span class="tree-label" onclick="showDocumentContent('文档介绍')">文档介绍</span>
                    <div class="tree-actions">
                        <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                        <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                        <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                    </div>
                </div>
                <div class="tree-item tree-parent">
                    <span class="tree-toggle" onclick="toggleTree(this)">▼</span>
                    <input type="checkbox" class="tree-checkbox">
                    <span class="tree-label" onclick="showDocumentContent('项目介绍')">项目介绍</span>
                    <div class="tree-actions">
                        <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                        <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                        <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                    </div>
                </div>
                <div class="tree-item tree-parent">
                    <span class="tree-toggle" onclick="toggleTree(this)">▼</span>
                    <input type="checkbox" class="tree-checkbox">
                    <span class="tree-label" onclick="showDocumentContent('功能性需求')">功能性需求</span>
                    <div class="tree-actions">
                        <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                        <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                        <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                    </div>
                </div>
            `;
        } else {
            treeHTML = `
                <div class="tree-item tree-parent">
                    <span class="tree-toggle" onclick="toggleTree(this)">▼</span>
                    <input type="checkbox" class="tree-checkbox">
                    <span class="tree-label" onclick="showDocumentContent('功能概述')">功能概述</span>
                    <div class="tree-actions">
                        <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
                        <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
                        <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
                    </div>
                </div>
            `;
        }
        docTree.innerHTML = treeHTML;
        // 保存文档树到 localStorage
        localStorage.setItem('WT_doc_tree', treeHTML);
    }
    
    // 默认显示文档介绍的内容
    if (docEditor) {
        docEditor.innerHTML = documentContents['文档介绍'];
        // 保存文档内容到 localStorage
        localStorage.setItem('WT_doc_content', documentContents['文档介绍']);
    }
    
    // 保存文档导入状态
    localStorage.setItem('WT_doc_imported', 'true');
    
    // 清除之前保存的需求数据（因为导入了新文档）
    localStorage.removeItem('WT_requirement_saved');
    localStorage.removeItem('WT_saved_requirement_content');
    localStorage.removeItem('WT_saved_requirement_tree');
    
    closeModal('importDocumentModal');
    showToast('文档导入成功', 'success');
}

// 显示指定节点的文档内容
function showDocumentContent(nodeName) {
    const docEditor = document.getElementById('docEditor');
    if (docEditor && documentContents[nodeName]) {
        docEditor.innerHTML = documentContents[nodeName];
    } else if (docEditor) {
        // 如果没有预定义内容，显示默认提示
        docEditor.innerHTML = `
            <div class="doc-section">
                <h3>${escapeHtml(nodeName)}</h3>
                <p>暂无详细内容</p>
            </div>
        `;
    }
}

// AI需求评审功能
function startAIReview() {
    // 检查是否有选中的标题
    const checkedItems = document.querySelectorAll('.tree-checkbox:checked');
    if (checkedItems.length === 0) {
        showToast('请先勾选需要评审的标题', 'error');
        return;
    }
    
    // 显示AI评审模态框
    const modal = document.getElementById('aiReviewModal');
    modal.classList.add('active');
    
    // 重置状态
    document.getElementById('reviewEmpty').style.display = 'flex';
    document.getElementById('reviewProcessing').style.display = 'none';
    document.getElementById('btnStartReview').style.display = 'inline-block';
    document.getElementById('reviewResults').innerHTML = '';
    
    // 点击遮罩层关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal('aiReviewModal');
        }
    };
}

function confirmAIReview() {
    // 隐藏空状态，显示处理中状态
    document.getElementById('reviewEmpty').style.display = 'none';
    document.getElementById('reviewProcessing').style.display = 'block';
    document.getElementById('btnStartReview').style.display = 'none';
    
    // 模拟AI评审过程
    const reviewResults = [
        { type: '安全隐患-传输协议', content: '"当前请求URL使用HTTP协议，登录接口涉及敏感信息（用户名、密码）传输，存在被窃听风险。建议强制使用HTTPS协议以保障数据传输安全。"' },
        { type: '安全隐患-密码处理', content: '"建议密码字段在传输前进行加密处理（如MD5、SHA256或RSA加密），明文传输密码是严重的安全漏洞。需补充密码加密机制及密钥管理说明。"' },
        { type: '输入校验-长度与格式限制', content: '"缺少对username和password字段的长度限制（最小/最大字符数）及格式规范（如是否允许特殊字符、空格、中文等），需明确后端校验规则，防止SQL注入或缓冲区溢出攻击。"' },
        { type: '业务逻辑-登录失败处理', content: '"未提及登录失败的处理机制。建议增加连续登录失败后的锁定策略、验证码触发机制或IP限流策略，以防止暴力破解攻击。"' },
        { type: '响应定义缺失', content: '"文档仅描述了请求参数，未定义登录成功/失败的响应格式（如HTTP状态码、返回JSON结构）。需补充完整的API响应规范。"' }
    ];
    
    const resultsContainer = document.getElementById('reviewResults');
    resultsContainer.innerHTML = '';
    
    // 逐条显示评审结果
    let index = 0;
    const interval = setInterval(() => {
        if (index < reviewResults.length) {
            const item = reviewResults[index];
            const resultHTML = `
                <div class="review-result-item">
                    <input type="checkbox" class="review-checkbox" data-type="${escapeHtml(item.type)}">
                    <div class="result-type">${escapeHtml(item.type)}</div>
                    <div class="result-content">${escapeHtml(item.content)}</div>
                </div>
            `;
            resultsContainer.innerHTML += resultHTML;
            index++;
        } else {
            clearInterval(interval);
            // 评审完成，更新状态
            document.querySelector('.review-processing-header').innerHTML = '<span>AI处理完成</span>';
            document.querySelector('.review-processing-status').style.display = 'none';
        }
    }, 800);
}

function switchReviewTab(tab) {
    const tabs = document.querySelectorAll('.ai-review-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'review') {
        tabs[0].classList.add('active');
        document.getElementById('reviewContent').style.display = 'block';
        document.getElementById('recordsContent').style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        document.getElementById('reviewContent').style.display = 'none';
        document.getElementById('recordsContent').style.display = 'block';
    }
}

function adoptReview() {
    const checkedBoxes = document.querySelectorAll('.review-checkbox:checked');
    if (checkedBoxes.length === 0) {
        showToast('请先勾选需要采纳的建议', 'error');
        return;
    }
    showToast('已采纳当前建议', 'success');
}

function saveReview() {
    closeModal('aiReviewModal');
}

function saveRequirement() {
    const btnSave = document.getElementById('btnSaveRequirement');
    btnSave.classList.remove('btn-secondary');
    btnSave.classList.add('btn-success');
    
    // 保存当前文档内容到 localStorage
    const docEditor = document.getElementById('docEditor');
    if (docEditor) {
        localStorage.setItem('WT_saved_requirement_content', docEditor.innerHTML);
    }
    
    // 保存文档树结构
    const docTree = document.getElementById('docTree');
    if (docTree) {
        localStorage.setItem('WT_saved_requirement_tree', docTree.innerHTML);
    }
    
    // 保存保存状态标记
    localStorage.setItem('WT_requirement_saved', 'true');
    
    showToast('保存成功', 'success');
}

function addChildNode(element) {
    event.stopPropagation();
    const treeItem = element.closest('.tree-item');
    const label = treeItem.querySelector('.tree-label').textContent;
    
    // 创建添加子节点的模态框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'addChildModal';
    modal.innerHTML = `
        <div class="modal modal-small">
            <div class="modal-header">
                <h3>添加子节点</h3>
                <button class="modal-close" onclick="closeModal('addChildModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>父节点：${escapeHtml(label)}</label>
                </div>
                <div class="form-group">
                    <label>* 子节点名称</label>
                    <input type="text" id="childNodeName" placeholder="请输入子节点名称">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('addChildModal')">取消</button>
                <button class="btn btn-primary" onclick="confirmAddChildNode()">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 点击遮罩层关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal('addChildModal');
        }
    });
    
    // 聚焦输入框
    setTimeout(() => {
        document.getElementById('childNodeName').focus();
    }, 100);
}

function confirmAddChildNode() {
    const childNodeName = document.getElementById('childNodeName').value.trim();
    if (!childNodeName) {
        showToast('请输入子节点名称', 'error');
        return;
    }
    
    // 获取当前父节点
    const modal = document.getElementById('addChildModal');
    const treeItem = modal.closest('.modal-overlay').previousElementSibling || 
                     document.querySelector('.tree-item');
    
    // 在父节点后添加子节点
    const newChildItem = document.createElement('div');
    newChildItem.className = 'tree-item';
    newChildItem.innerHTML = `
        <input type="checkbox" class="tree-checkbox">
        <span class="tree-label" onclick="showDocumentContent('${escapeHtml(childNodeName)}')">${escapeHtml(childNodeName)}</span>
        <div class="tree-actions">
            <a href="javascript:;" class="tree-action" onclick="addChildNode(this)">添加</a>
            <a href="javascript:;" class="tree-action" onclick="editNode(this)">编辑</a>
            <a href="javascript:;" class="tree-action tree-action-delete" onclick="deleteNode(this)">删除</a>
        </div>
    `;
    
    // 查找父节点并添加子节点
    const parentLabel = modal.querySelector('.form-group label').textContent.replace('父节点：', '');
    const allTreeItems = document.querySelectorAll('.tree-item');
    let parentItem = null;
    for (let item of allTreeItems) {
        const label = item.querySelector('.tree-label');
        if (label && label.textContent === parentLabel) {
            parentItem = item;
            break;
        }
    }
    
    if (parentItem) {
        // 检查是否有子节点容器
        let childrenContainer = parentItem.nextElementSibling;
        if (!childrenContainer || !childrenContainer.classList.contains('tree-children')) {
            // 创建子节点容器
            childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            parentItem.parentNode.insertBefore(childrenContainer, parentItem.nextSibling);
        }
        childrenContainer.appendChild(newChildItem);
    }
    
    closeModal('addChildModal');
    showToast('子节点添加成功', 'success');
}

function editNode(element) {
    event.stopPropagation();
    const treeItem = element.closest('.tree-item');
    const label = treeItem.querySelector('.tree-label');
    const currentName = label.textContent;
    
    // 创建编辑节点的模态框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'editNodeModal';
    modal.innerHTML = `
        <div class="modal modal-small">
            <div class="modal-header">
                <h3>编辑节点</h3>
                <button class="modal-close" onclick="closeModal('editNodeModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>* 节点名称</label>
                    <input type="text" id="editNodeName" value="${escapeHtml(currentName)}" placeholder="请输入节点名称">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('editNodeModal')">取消</button>
                <button class="btn btn-primary" onclick="confirmEditNode()">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 点击遮罩层关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal('editNodeModal');
        }
    });
    
    // 聚焦并选中输入框内容
    setTimeout(() => {
        const input = document.getElementById('editNodeName');
        input.focus();
        input.select();
    }, 100);
}

function confirmEditNode() {
    const newNodeName = document.getElementById('editNodeName').value.trim();
    if (!newNodeName) {
        showToast('请输入节点名称', 'error');
        return;
    }
    
    // 更新节点名称
    const modal = document.getElementById('editNodeModal');
    const allTreeItems = document.querySelectorAll('.tree-item');
    for (let item of allTreeItems) {
        const label = item.querySelector('.tree-label');
        if (label && label.textContent === modal.querySelector('#editNodeName').defaultValue) {
            label.textContent = newNodeName;
            label.setAttribute('onclick', `showDocumentContent('${escapeHtml(newNodeName)}')`);
            break;
        }
    }
    
    closeModal('editNodeModal');
    showToast('节点编辑成功', 'success');
}

let deleteNodeLabel = '';

function deleteNode(element) {
    event.stopPropagation();
    const treeItem = element.closest('.tree-item');
    deleteNodeLabel = treeItem.querySelector('.tree-label').textContent;
    
    // 创建删除确认模态框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'deleteNodeModal';
    modal.innerHTML = `
        <div class="modal modal-small">
            <div class="modal-header">
                <h3>确认删除</h3>
                <button class="modal-close" onclick="closeModal('deleteNodeModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>确认删除该目录吗？</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deleteNodeModal')">取消</button>
                <button class="btn btn-primary" onclick="confirmDeleteNode()">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 点击遮罩层关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal('deleteNodeModal');
        }
    });
}

function confirmDeleteNode() {
    const allTreeItems = document.querySelectorAll('.tree-item');
    
    for (let item of allTreeItems) {
        const itemLabel = item.querySelector('.tree-label');
        if (itemLabel && itemLabel.textContent === deleteNodeLabel) {
            item.remove();
            break;
        }
    }
    
    const modal = document.getElementById('deleteNodeModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            showToast('删除节点成功', 'success');
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', init);

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});
