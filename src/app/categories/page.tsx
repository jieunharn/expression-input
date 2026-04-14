import { Header } from "@/components/Layout/Header";
import { CategoryManager } from "@/components/CategoryManager";
import { listCategories } from "@/app/actions/categories";

export default async function CategoriesPage() {
  const rows = await listCategories();

  return (
    <>
      <Header title="카테고리" />
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 pb-16 md:p-8">
        <p className="text-sm text-muted-foreground">
          기본 6종 외에 사용자 정의 카테고리를 추가하고, 병합·삭제로 정리할 수 있습니다.
        </p>
        <CategoryManager initial={rows} />
      </div>
    </>
  );
}
