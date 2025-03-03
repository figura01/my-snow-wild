export interface ICategory {
    id: string;
    name: string;
}

export interface CategoryQuery {
    categories: ICategory[];
    findCategoryById: ICategory;
    findCategoryByName: ICategory;
}


  