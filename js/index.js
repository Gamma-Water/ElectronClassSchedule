var weekIndex = localStorage.getItem('weekIndex')
if (weekIndex === null) localStorage.setItem('weekIndex', '0')
weekIndex = Number(localStorage.getItem('weekIndex'))

function isBreakTime(startTime, endTime, currentTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const [currentH, currentM] = currentTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = currentH * 60 + currentM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function getNextClassIndex(timetable, currentIndex) {
    // 从当前时间点的下一个时间段开始，找到下一个课程的索引
    const timeKeys = Object.keys(timetable);
    for (let i = currentIndex + 1; i < timeKeys.length; i++) {
        if (typeof timetable[timeKeys[i]] === 'number') {
            return timetable[timeKeys[i]];
        }
    }
    return null; // 如果没有下一堂课，返回 null
}


function getCurrentDaySchedule() {
    const date = new Date();
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    const weekNumber = weekIndex; // 当前周数

    const dailyClass = scheduleConfig.daily_class[dayOfWeek];
    if (!dailyClass) return [];

    return dailyClass.classList.map(subject => {
        if (Array.isArray(subject)) {
            return subject[weekNumber]; // 处理每周不同的课程
        }
        return subject;
    });
}

function isClassCurrent(startTime, endTime, currentTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const [currentH, currentM] = currentTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = currentH * 60 + currentM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function getCurrentTime() {
    const now = new Date();
    return [
        now.getHours().toString().padStart(2, '0'),
        now.getMinutes().toString().padStart(2, '0'),
        now.getSeconds().toString().padStart(2, '0')
    ].join(':');
}
function getScheduleData() {
    const currentSchedule = getCurrentDaySchedule();
    const currentTime = getCurrentTime();
    // let currentTime = '07:10:01';
    const dayOfWeek = new Date().getDay();
    const dayTimetable = scheduleConfig.timetable[scheduleConfig.daily_class[dayOfWeek].timetable];

    let scheduleArray = [];
    let currentHighlight = { index: null, type: null, fullName: null, countdown: null, countdownText: null };

    Object.keys(dayTimetable).forEach((timeRange, index) => {
        const [startTime, endTime] = timeRange.split('-');
        const classIndex = dayTimetable[timeRange];

        if (typeof classIndex === 'number') {
            const subjectShortName = currentSchedule[classIndex];
            const subjectFullName = scheduleConfig.subject_name[subjectShortName];
            scheduleArray.push(subjectShortName);

            if (isClassCurrent(startTime, endTime, currentTime)) {
                currentHighlight.index = scheduleArray.length - 1;
                currentHighlight.type = 'current';
                currentHighlight.fullName = subjectFullName;
                currentHighlight.countdown = calculateCountdown(endTime, currentTime);
                currentHighlight.countdownText = formatCountdown(currentHighlight.countdown);
            }
        } else if (currentHighlight.index === null && isBreakTime(startTime, endTime, currentTime)) {
            let highlighted = false;
            for (let i = index + 1; i < Object.keys(dayTimetable).length; i++) {
                const nextTimeRange = Object.keys(dayTimetable)[i];
                const nextClassIndex = dayTimetable[nextTimeRange];
                if (typeof nextClassIndex === 'number') {
                    currentHighlight.index = scheduleArray.length;
                    currentHighlight.type = 'upcoming';
                    const nextSubjectShortName = currentSchedule[nextClassIndex];
                    const nextSubjectFullName = scheduleConfig.subject_name[nextSubjectShortName];
                    currentHighlight.fullName = dayTimetable[timeRange];
                    const [nextStartTime] = nextTimeRange.split('-');
                    currentHighlight.countdown = calculateCountdown(timeRange.split('-')[1], currentTime);
                    currentHighlight.countdownText = formatCountdown(currentHighlight.countdown);
                    highlighted = true;
                    break;
                }
            }
            if (!highlighted) {
                currentHighlight.index = currentSchedule.length - 1;
                currentHighlight.type = 'upcoming';
                currentHighlight.fullName = dayTimetable[timeRange];
                currentHighlight.countdown = calculateCountdown(timeRange.split('-')[1], currentTime);
                currentHighlight.countdownText = formatCountdown(currentHighlight.countdown);
                currentHighlight.isEnd = true;
            }
        } else if (currentHighlight.index === null && !dayTimetable[timeRange]) {
            // 当前时间是非课程时间（如课间休息）
            currentHighlight.fullName = currentSchedule[classIndex]; // 使用时间表中的描述
        }
    });

    return { scheduleArray, currentHighlight };
}

function calculateCountdown(targetTime, currentTime) {
    const [targetH, targetM] = targetTime.split(':').map(Number);
    const [currentH, currentM, currentS = '00'] = currentTime.split(':').map(Number);

    const targetTotalSeconds = targetH * 3600 + (targetM + 1) * 60;
    const currentTotalSeconds = currentH * 3600 + currentM * 60 + currentS;

    return targetTotalSeconds - currentTotalSeconds;
}

function formatCountdown(countdownSeconds) {
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
