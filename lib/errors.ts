export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Μη εξουσιοδοτημένη πρόσβαση") {
    super(message, 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Δεν έχετε δικαίωμα πρόσβασης") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Μη έγκυρα δεδομένα") {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Δεν βρέθηκε") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Υπερβήκατε το όριο αιτημάτων") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}
