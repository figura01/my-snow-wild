"use client"
import { useQuery, useLazyQuery } from "@apollo/client";
import { useState } from 'react';
// import ListMaterial from "@/components/ListMaterial";
import { LIST_CATEGORIES } from "@/requests/queries/category.queries";
import { LIST_MATERIAL, LIST_MATERIAL_BY_CATEGORY_NAME } from "@/requests/queries/material.queries";
import { CategoryQuery } from "@/types/category";
import { Material, MaterialQuery } from "@/types/marterial";
import CardProduct from "@/components/card-product";
import FilterButton from "@/components/products/FilterButton";


import styles from './ProductPage.module.css';

const Products = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const handleCategoryClick = (categoryName: string) => {
        console.log('select cat: ', categoryName)
        setSelectedCategory(categoryName);
        if (categoryName !== 'all') {
            getMaterialsByCategoryName({ 
                variables: { 
                    name: categoryName 
                },
                fetchPolicy: "no-cache",
            });
        }
    };

    const { data: allMaterialsData, loading: allMaterialsLoading, error: allMaterialsError } = useQuery<MaterialQuery>(LIST_MATERIAL, {
        fetchPolicy: "no-cache"
    });

    const { data: allCategoriesData, loading: allCategoriesLoading, error: allCategoriesError } = useQuery<CategoryQuery>(LIST_CATEGORIES, {
        fetchPolicy: "no-cache"
    });

    const [getMaterialsByCategoryName, 
    { 
        data: materialsDataByCategory, 
        loading: materialsDataByCategoryLoading, 
        error: materialsDataByCategoryError 
    }] = useLazyQuery<MaterialQuery>(LIST_MATERIAL_BY_CATEGORY_NAME)

    const materialsToDisplay = selectedCategory === 'all' ? allMaterialsData?.listMaterials : materialsDataByCategory?.findMaterialsByCategoryName;
    
    return (
        <div className="w-full h-full bg-green-100 ">
            <div className={`${styles.filtersBar} flex py-2 w-full relative`}>
                <div className="container sticky no-wrap gap-2 ">
                    <FilterButton
                        selectedCategory={selectedCategory}
                        categoryName={'all'}
                        onHandleCategoryClick={handleCategoryClick}
                    />
                        
                    {!allCategoriesLoading && allCategoriesData && allCategoriesData?.categories.map((category: Category) => {
                        return (
                            <FilterButton
                                key={category.id}
                                categoryName={category.name}
                                selectedCategory={selectedCategory}
                                onHandleCategoryClick={handleCategoryClick}
                            />
                        )
                    })}
                </div>
            </div>
            <div className="container h-full">
                <h1 className="text-3xl">Our Products</h1>
                <section>
                    {(allMaterialsLoading || materialsDataByCategoryLoading) && <p className="text-gray-500">Chargement des articles...</p>}
                    {(allMaterialsError || materialsDataByCategoryError) && <p className="text-red-500">Erreur lors du chargement des articles.</p>}
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ">
                        {!allMaterialsLoading && materialsToDisplay && materialsToDisplay.map((material: Material) => {
                            return <li key={material.id}>
                                <CardProduct 
                                    {...material}
                                />
                            </li>
                        })}
                    </ul>
                </section>
            </div>
        </div>
    )
}

export default Products