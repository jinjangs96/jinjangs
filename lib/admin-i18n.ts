export type AdminLocale = 'ko' | 'vi'

export const ADMIN_STATUS_LABELS: Record<AdminLocale, Record<string, string>> = {
  ko: {
    new: '신규',
    accepted: '수락',
    preparing: '준비중',
    packed: '포장완료',
    out_for_delivery: '배달중',
    completed: '완료',
    canceled: '취소',
  },
  vi: {
    new: 'Mới',
    accepted: 'Đã nhận',
    preparing: 'Đang chuẩn bị',
    packed: 'Đã đóng gói',
    out_for_delivery: 'Đang giao',
    completed: 'Hoàn tất',
    canceled: 'Đã hủy',
  },
}

export const ADMIN_PAYMENT_STATUS_LABELS: Record<AdminLocale, Record<string, string>> = {
  ko: {
    pending: '입금 대기',
    transfer_waiting: '이체 확인 대기',
    paid: '입금 확인',
    failed: '실패',
    refunded: '환불 완료',
  },
  vi: {
    pending: 'Chờ thanh toán',
    transfer_waiting: 'Chờ xác nhận chuyển khoản',
    paid: 'Đã thanh toán',
    failed: 'Thất bại',
    refunded: 'Đã hoàn tiền',
  },
}

export const ADMIN_COMMON_BUTTON_LABELS: Record<AdminLocale, Record<string, string>> = {
  ko: {
    save: '저장',
    cancel: '취소',
    close: '닫기',
    edit: '수정',
    update: '업데이트',
    confirm: '확인',
  },
  vi: {
    save: 'Lưu',
    cancel: 'Hủy',
    close: 'Đóng',
    edit: 'Chỉnh sửa',
    update: 'Cập nhật',
    confirm: 'Xác nhận',
  },
}

export function getAdminLabel(
  locale: AdminLocale,
  dict: Record<AdminLocale, Record<string, string>>,
  key: string
): string {
  const byLocale = dict[locale] || dict.ko
  return byLocale[key] || dict.ko[key] || key
}

