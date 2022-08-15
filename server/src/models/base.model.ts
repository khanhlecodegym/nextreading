// Listing
export interface ListingHeaderTypes {
  name: string;
  field: string;
  status?: boolean;
  url?: boolean;
}

export interface ListingReqQueryPayload {
  type?: string;
  query?: string;
  page?: number;
  error?: boolean;
  success?: boolean;
  message?: string;

  // Common used in so many router/query
  bookId?: string;
  userId?: string;
  badgeId?: string;
  reviewId?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
}
