import Category from "../src/entities/category.entity";

export type ResponseData = {
  categories: Category[];
};

export type CreateResponseData = {
  createCategory: Category;
};

export type DeleteResponseData = {
  deleteCategory: Category;
};

export type CategoryNameResponseData = {
  findCategory: Category;
};
