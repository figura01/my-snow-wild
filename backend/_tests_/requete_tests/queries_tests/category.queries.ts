export const LIST_CATEGORY = `#graphql
query Query {
  categories {
    id
    
  }
}`;

export const FIND_CATEGORY_BY_ID = `#graphql
    query FindCategory($findCategoryId: String!) {
	    findCategory(id: $findCategoryId) {
	        id
	        name
	    }
    }
`;

export const LIST_CATEGORY_WITH_NAME = `#graphql
    query Category {
        categories {        
            name
        }
    }`;
