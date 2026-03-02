/**
 * ReviewList Component - Task 13.5
 * Displays paginated reviews with metadata
 */

import React, { useState } from 'react';
import { Review } from '../../types';

interface ReviewListProps {
  reviews: Review[];
}

export const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(reviews.length / pageSize);

  const paginatedReviews = reviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="review-list">
      {paginatedReviews.map((review) => (
        <div key={review.feedbackId} className="review-item">
          <div className="review-header">
            <span className="rating">{renderStars(review.rating)}</span>
            <span className={`sentiment ${review.sentimentLabel}`}>
              {review.sentimentLabel}
            </span>
            <span className="timestamp">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="review-content">
            <p>{review.reviewText}</p>
          </div>
          <div className="review-meta">
            <span className="temple">{review.templeName}</span>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
