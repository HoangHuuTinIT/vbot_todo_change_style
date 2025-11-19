import type { TodoStatus } from '@/types/todo';

// Sử dụng Enum hoặc đối tượng có kiểu rõ ràng hơn
export const TODO_STATUS: Record<string, TodoStatus> = {
    NEW: 'TO_DO',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE'
};

export const STATUS_LABELS: Record<TodoStatus, string> = {
    [TODO_STATUS.NEW]: 'Chờ xử lý',
    [TODO_STATUS.IN_PROGRESS]: 'Đang xử lý',
    [TODO_STATUS.DONE]: 'Hoàn thành'
};

export const STATUS_COLORS: Record<TodoStatus, string> = {
    [TODO_STATUS.DONE]: 'bg-green',
    [TODO_STATUS.IN_PROGRESS]: 'bg-orange',
    [TODO_STATUS.NEW]: 'bg-gray'
};