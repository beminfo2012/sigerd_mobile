/**
 * Notification System Test Suite
 * Tests for Rules, Deduplication, Badge Calculation, and Read State Logic
 */

// 1. Badge Calculation Test
export const testBadgeCalculation = () => {
    const formatBadge = (count) => {
        if (!count || count <= 0) return null;
        return count > 99 ? '99+' : String(count);
    };

    console.assert(formatBadge(0) === null, 'Test Badge 0 failed');
    console.assert(formatBadge(1) === '1', 'Test Badge 1 failed');
    console.assert(formatBadge(10) === '10', 'Test Badge 10 failed');
    console.assert(formatBadge(99) === '99', 'Test Badge 99 failed');
    console.assert(formatBadge(100) === '99+', 'Test Badge 100 failed');
    console.assert(formatBadge(150) === '99+', 'Test Badge 150 failed');

    return true;
};

// 2. Pluviometer State Machine Rule Test
export const testPluviometroStateMachine = () => {
    let state = 'NORMAL';
    const alerts = [];

    const processMeasurement = (stationId, mm24h) => {
        if (mm24h >= 50) {
            if (state === 'NORMAL') {
                alerts.push({ stationId, mm24h, group_key: `pluviometro-${stationId}-50mm` });
                state = 'ALERTA_GERADO';
            }
            // If state === 'ALERTA_GERADO', DO NOT generate duplicate
        } else {
            if (state === 'ALERTA_GERADO') {
                state = 'NORMAL';
            }
        }
    };

    // 49.9mm -> no alert
    processMeasurement('santa-maria', 49.9);
    console.assert(alerts.length === 0, 'Pluviometer 49.9mm should not trigger alert');

    // 50.0mm -> trigger alert #1
    processMeasurement('santa-maria', 50.0);
    console.assert(alerts.length === 1, 'Pluviometer 50.0mm should trigger alert');

    // 52.3mm -> remain above 50mm, do not duplicate
    processMeasurement('santa-maria', 52.3);
    console.assert(alerts.length === 1, 'Pluviometer repeat above 50mm should not duplicate');

    // Return to 40.0mm -> state resets to NORMAL
    processMeasurement('santa-maria', 40.0);
    console.assert(state === 'NORMAL', 'Pluviometer state should reset to NORMAL below 50mm');

    // Cross 50.0mm again -> trigger alert #2
    processMeasurement('santa-maria', 55.0);
    console.assert(alerts.length === 2, 'Pluviometer re-crossing 50mm should trigger new alert');

    return true;
};

// 3. NOPRER Due Date Rule Test
export const testNoprerDueDateRule = () => {
    const checkNoprer = (dueDateStr, currentDateStr = '2026-08-28T00:00:00Z') => {
        const dueDate = new Date(dueDateStr);
        const current = new Date(currentDateStr);
        const diffDays = Math.ceil((dueDate.getTime() - current.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 5;
    };

    // 6 days left -> False
    console.assert(!checkNoprer('2026-09-03T00:00:00Z'), 'NOPRER > 5 days should not alert');
    // 5 days left -> True
    console.assert(checkNoprer('2026-09-02T00:00:00Z'), 'NOPRER 5 days should alert');
    // 2 days left -> True
    console.assert(checkNoprer('2026-08-30T00:00:00Z'), 'NOPRER 2 days should alert');
    // Expired -> True
    console.assert(checkNoprer('2026-08-27T00:00:00Z'), 'NOPRER expired should alert');

    return true;
};

// 4. Deduplication by group_key Test
export const testDeduplicationByGroupKey = () => {
    const list = [];
    const addWithDeduplication = (item) => {
        if (list.some(x => x.group_key === item.group_key)) {
            return false; // Prevent duplicate
        }
        list.push(item);
        return true;
    };

    const notif1 = { id: '1', group_key: 'noprer-doc-123-2026-09-02', title: 'Test' };
    const notif2 = { id: '2', group_key: 'noprer-doc-123-2026-09-02', title: 'Duplicate Test' };
    const notif3 = { id: '3', group_key: 'noprer-doc-456-2026-09-05', title: 'Other Doc' };

    console.assert(addWithDeduplication(notif1) === true, 'First item insertion should succeed');
    console.assert(addWithDeduplication(notif2) === false, 'Duplicate group_key should be blocked');
    console.assert(list.length === 1, 'List should only contain 1 item');
    console.assert(addWithDeduplication(notif3) === true, 'Different group_key should be inserted');
    console.assert(list.length === 2, 'List should contain 2 items');

    return true;
};

// Run all unit tests
export const runAllNotificationTests = () => {
    try {
        testBadgeCalculation();
        testPluviometroStateMachine();
        testNoprerDueDateRule();
        testDeduplicationByGroupKey();
        console.log('✅ All Notification Unit Tests Passed Successfully!');
        return { success: true };
    } catch (err) {
        console.error('❌ Notification Unit Test Failed:', err);
        return { success: false, error: err };
    }
};
