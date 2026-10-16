import type { Metadata } from 'next';
import { BooksBazaar } from '@/components/books/BooksBazaar';

export const metadata: Metadata = {
  title: 'Kitabein Bazaar — Books | SastaBazaar',
  description: 'NCERT, CBSE, ICSE, State Boards, Engineering, Medical, UPSC, BA, BCom, BSc books — new and old at best prices.'
};

export default function BooksPage() {
  return <BooksBazaar />;
}
