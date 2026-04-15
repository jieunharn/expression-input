import Link from "next/link";
import { Header } from "@/components/Layout/Header";
import { StatsWidget } from "@/components/StatsWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/app/actions/dashboard";

export default async function DashboardPage() {
  const s = await getDashboardStats();

  return (
    <>
      <Header title="학습 대시보드" />
      <div className="mx-auto w-full max-w-5xl space-y-8 p-4 pb-16 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">통역사·번역가 표현 저장소</p>
            <h2 className="text-2xl font-bold tracking-tight">오늘의 학습 현황</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/add">표현 추가</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/study/flashcard">플래시카드</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/study/quiz">퀴즈</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsWidget title="저장된 표현" value={s.totalExpressions} />
          <StatsWidget title="복습 예정 (SRS)" value={s.dueSoon} hint="오늘 기준 due" />
          <StatsWidget title="오늘 학습한 표현" value={s.studiedToday} />
          <StatsWidget title="이번 주 학습" value={s.studiedWeek} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatsWidget
            title="연속 학습일"
            value={`${s.streak}일`}
            hint="세션 완료 시 갱신"
          />
          <StatsWidget
            title="최근 퀴즈 평균 정확도"
            value={
              s.recentQuizAccuracy != null
                ? `${Math.round(s.recentQuizAccuracy * 100)}%`
                : "—"
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">약한 카테고리</CardTitle>
              <p className="text-sm text-muted-foreground">
                퀴즈/학습 3회 이상, 정확도 낮은 순
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {s.weakest.length === 0 ? (
                <p className="text-sm text-muted-foreground">데이터가 더 쌓이면 표시됩니다.</p>
              ) : (
                s.weakest.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/80 px-3 py-2"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {c.accuracy != null ? `${Math.round(c.accuracy * 100)}%` : "—"}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">최근 추가</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/bank">전체 보기</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {s.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">아직 표현이 없습니다.</p>
              ) : (
                s.recent.map((e) => (
                  <div
                    key={e.id}
                    className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <p className="text-sm font-medium line-clamp-2">{e.english}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
