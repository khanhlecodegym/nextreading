// Seed data
import { categories } from '../constants/data/category';
import { authors } from '../constants/data/author';

// Models
import { Category } from '../models/category.model';
import { Author } from '../models/author.model';

export const initCategory = () => Category.insertMany(categories);
export const initAuthor = () => Author.insertMany(authors);
