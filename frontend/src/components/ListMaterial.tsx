import { useQuery, useLazyQuery } from "@apollo/client";
import { LIST_CATEGORIES } from "@/requests/queries/category.queries";
import { LIST_MATERIAL, LIST_MATERIAL_BY_CATEGORY_ID } from "@/requests/queries/material.queries";
import { Category, CategoryQuery } from "@/types/category";

import { useState } from "react";
import Link from "next/link";
import CardProduct from '@/components/card-product'
import { Material, MaterialQuery } from "@/types/marterial";

const ListMaterial: React.FC = () => {
  const { data: categoriesData, loading: categoriesLoading, error: categoriesError } = useQuery<CategoryQuery>(LIST_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: allMaterialsData, loading: allMaterialsLoading, error: allMaterialsError } = useQuery<MaterialQuery>(LIST_MATERIAL, {
    fetchPolicy: "network-only"
  });
  const [getMaterialsByCategory, { data: materialsData, loading: materialsLoading, error: materialsError }] = useLazyQuery<MaterialQuery>(LIST_MATERIAL_BY_CATEGORY_ID);

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      getMaterialsByCategory({ variables: { findMaterialByCategoryId: categoryId } });
    }
  };

  const materialsToDisplay = selectedCategory ? materialsData?.findMaterialByCategoryId : allMaterialsData?.listMaterials;

  return (
    <div className="container mx-auto 4 py-8 font-poppins">
      <div className="flex justify-center gap-4 mb-6">
        {categoriesLoading && <p>Loading categories...</p>}
        {categoriesError && <p>Error loading categories: {categoriesError.message}</p>}
        <button
          onClick={() => handleCategoryClick(null)}
          className="px-4 py-2 w-24 border uppercase border-stone-950 text-black rounded-lg hover:bg-stone-950 hover:text-white transition"
        >
          Tous les produits
        </button>
        {categoriesData?.categories.map((c: Category) => (
          <button
            key={c.id}
            onClick={() => handleCategoryClick(c.id)}
            className="px-4 py-2 w-24 border uppercase border-stone-950 text-black rounded-lg hover:bg-stone-950 hover:text-white transition"
          >

            {c.name}
          </button>


        ))}
      </div>

      {(allMaterialsLoading || materialsLoading) && <p className="text-gray-500">Chargement des articles...</p>}
      {(allMaterialsError || materialsError) && <p className="text-red-500">Erreur lors du chargement des articles.</p>}

      {materialsToDisplay && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ">
          {materialsToDisplay.map((item: Material) => (
              <li
                key={item.id.toString()}
                className="bg-white  overflow-hidden transform transition duration-500 hover:scale-105"
              >
                <CardProduct 
                  {...item}
                />
                {/* <Link href={`/${item.id}`}>
                  <div className="block">
                    <div className="relative flex rounded-lg shadow-lg justify-center items-center h-52 overflow-hidden  rounded-t-lg">
                      <img
                        className="object-cover h-full "
                        src={process.env.NEXT_PUBLIC_IMAGE_URL + item.picture}
                        alt={item.name}
                      />
                      <div className="absolute   inset-0 bg-gradient-to-b from-transparent to-neutral-700  opacity-50"></div>
                    </div>
                    <div className="relative p-6">
                      <h2 className=" uppercase text-xl text-neutral-950 font-bold ">
                        {item.name}
                      </h2>
                      <p className=" text-neutral-950 text-sm ">
                        {item.description.slice(0, 80)}
                        {item.description.length > 80 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                </Link> */}
              </li>
            ))}        
        </ul>
      )}
    </div>
  );
};

export default ListMaterial;
