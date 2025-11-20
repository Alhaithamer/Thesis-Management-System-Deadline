document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const deadlineForm = document.getElementById('deadline-form');
    const targetWordsInput = document.getElementById('target-words');
    const deadlineDateInput = document.getElementById('deadline-date');
    const countdownSection = document.getElementById('countdown-section');
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const progressSection = document.getElementById('progress-section');
    const completedWordsElement = document.getElementById('completed-words');
    const dailyTargetElement = document.getElementById('daily-target');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const updateWordsInput = document.getElementById('update-words');
    const updateButton = document.getElementById('update-button');
    
    // 初始化显示
    countdownSection.style.display = 'none';
    progressSection.style.display = 'none';
    
    // 设置默认日期为未来30天
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const formattedDate = defaultDate.toISOString().split('T')[0];
    deadlineDateInput.value = formattedDate;
    
    // 请求通知权限
    requestNotificationPermission();
    
    // 检查本地存储是否有数据
    const savedData = localStorage.getItem('thesisDeadlineData');
    if (savedData) {
        const data = JSON.parse(savedData);
        targetWordsInput.value = data.targetWords || 10000;
        deadlineDateInput.value = data.deadlineDate;
        
        // 显示已保存的数据
        updateDisplay();
        
        // 检查是否需要显示每日通知
        checkAndShowDailyNotification();
    }
    
    // 表单提交处理
    deadlineForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const targetWords = parseInt(targetWordsInput.value);
        const deadlineDate = deadlineDateInput.value;
        
        // 保存到本地存储
        const data = {
            targetWords,
            deadlineDate,
            completedWords: 0,
            lastNotificationDate: ''
        };
        
        localStorage.setItem('thesisDeadlineData', JSON.stringify(data));
        
        // 更新显示
        updateDisplay();
        
        // 显示通知
        showNotification(`论文任务已设置！目标${targetWords}字，截止日期${deadlineDate}`);
    });
    
    // 更新进度按钮点击事件
    updateButton.addEventListener('click', function() {
        const updateWords = parseInt(updateWordsInput.value);
        if (isNaN(updateWords) || updateWords < 0) {
            alert('请输入有效的字数');
            return;
        }
        
        // 更新本地存储
        const savedData = JSON.parse(localStorage.getItem('thesisDeadlineData'));
        savedData.completedWords += updateWords;
        localStorage.setItem('thesisDeadlineData', JSON.stringify(savedData));
        
        // 更新显示
        updateProgressDisplay();
        
        // 清空输入框
        updateWordsInput.value = '';
        
        showNotification(`已记录${updateWords}字的进度！`);
    });
    
    // 更新显示
    function updateDisplay() {
        countdownSection.style.display = 'block';
        progressSection.style.display = 'block';
        
        // 启动倒计时
        startCountdown();
        
        // 更新进度显示
        updateProgressDisplay();
    }
    
    // 启动倒计时
    function startCountdown() {
        function updateCountdown() {
            const savedData = JSON.parse(localStorage.getItem('thesisDeadlineData'));
            if (!savedData) return;
            
            const deadline = new Date(savedData.deadlineDate);
            const now = new Date();
            const diff = deadline - now;
            
            if (diff <= 0) {
                daysElement.textContent = '0';
                hoursElement.textContent = '00';
                minutesElement.textContent = '00';
                secondsElement.textContent = '00';
                return;
            }
            
            // 计算天、时、分、秒
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            // 更新显示
            daysElement.textContent = days;
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            secondsElement.textContent = seconds.toString().padStart(2, '0');
        }
        
        // 立即更新一次
        updateCountdown();
        
        // 每秒更新一次
        setInterval(updateCountdown, 1000);
    }
    
    // 更新进度显示
    function updateProgressDisplay() {
        const savedData = JSON.parse(localStorage.getItem('thesisDeadlineData'));
        if (!savedData) return;
        
        const { targetWords, deadlineDate, completedWords } = savedData;
        
        // 更新已完成字数
        completedWordsElement.textContent = completedWords;
        
        // 计算剩余天数
        const deadline = new Date(deadlineDate);
        const now = new Date();
        const diff = deadline - now;
        const remainingDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        // 计算每日应写字数 (AI结合点：剩余字数 / 剩余天数，向上取整)
        const remainingWords = Math.max(0, targetWords - completedWords);
        const dailyTarget = remainingDays > 0 ? Math.ceil(remainingWords / remainingDays) : 0;
        dailyTargetElement.textContent = dailyTarget;
        
        // 更新进度条
        const progressPercentage = Math.min(100, Math.round((completedWords / targetWords) * 100));
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${progressPercentage}%`;
        
        // 更新本地存储中的每日目标
        savedData.dailyTarget = dailyTarget;
        localStorage.setItem('thesisDeadlineData', JSON.stringify(savedData));
    }
    
    // 请求通知权限
    function requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }
    
    // 显示通知
    function showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('论文Deadline倒数', {
                body: message,
                icon: 'https://via.placeholder.com/32'
            });
        }
    }
    
    // 检查并显示每日通知
    function checkAndShowDailyNotification() {
        const savedData = JSON.parse(localStorage.getItem('thesisDeadlineData'));
        if (!savedData) return;
        
        const today = new Date().toDateString();
        const lastNotification = savedData.lastNotificationDate;
        
        if (lastNotification !== today) {
            // 更新每日应写字数
            const deadline = new Date(savedData.deadlineDate);
            const now = new Date();
            const diff = deadline - now;
            const remainingDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
            const remainingWords = Math.max(0, savedData.targetWords - savedData.completedWords);
            const dailyTarget = remainingDays > 0 ? Math.ceil(remainingWords / remainingDays) : 0;
            
            // 显示每日通知
            showNotification(`今日论文任务：需要完成${dailyTarget}字，加油！`);
            
            // 更新最后通知日期
            savedData.lastNotificationDate = today;
            localStorage.setItem('thesisDeadlineData', JSON.stringify(savedData));
        }
    }
});