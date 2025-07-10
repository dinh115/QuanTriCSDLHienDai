export interface Review {
  masp: string;
  mauser: string;
  username: string;
  rating: number;
  review_date: Date;
  phanloai?: string;
  chatluong?: string;
  mota_dung?: string;
  noidung: string;
  images?: string[];
  has_images: boolean;
  reply_date?: Date;
  reply_content?: string;
}