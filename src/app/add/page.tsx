import { notFound } from "next/navigation";
import { Header } from "@/components/Layout/Header";
import { AddExpressionForm } from "@/components/AddExpressionForm";
import { listCategories } from "@/app/actions/categories";
import { getExpression } from "@/app/actions/expressions";
import { isAnthropicConfigured } from "@/lib/ai";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function AddPage({ searchParams }: Props) {
  const id = typeof searchParams.id === "string" ? searchParams.id : undefined;
  const categories = await listCategories();
  if (!categories.length) {
    return (
      <>
        <Header title="표현 추가" />
        <div className="p-6 text-sm text-muted-foreground">
          카테고리가 없습니다. <code className="rounded bg-muted px-1">npm run db:seed</code>를 실행하세요.
        </div>
      </>
    );
  }

  const editing = id ? await getExpression(id) : null;
  if (id && !editing) notFound();

  const aiAutoFillEnabled = isAnthropicConfigured();

  return (
    <>
      <Header title={editing ? "표현 편집" : "표현 추가"} />
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-16 md:p-8">
        <p className="text-sm text-muted-foreground">
          {aiAutoFillEnabled
            ? "영문만 입력하고 AI로 한국어 옵션·예문·난이도·카테고리 초안을 채운 뒤, 출처와 메모를 추가해 저장하세요."
            : "영문과 한국어 번역·예문 등을 직접 입력하고 출처를 기록해 저장할 수 있습니다. AI 자동 채우기는 API 키를 설정하면 켜집니다."}
        </p>
        <AddExpressionForm
          categories={categories}
          editing={editing}
          aiAutoFillEnabled={aiAutoFillEnabled}
        />
      </div>
    </>
  );
}
