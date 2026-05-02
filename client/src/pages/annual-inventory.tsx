import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, ChevronRight, ChevronLeft, Package, Users, Landmark, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { openPrintWindow } from "@/lib/printStyles";
import { useLanguage } from "@/lib/language-context";

const fmt = (n: number) => n.toLocaleString("ar-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function BalanceBadge({ cny, usd }: { cny: number; usd: number }) {
  const settled = Math.abs(cny) < 0.01 && Math.abs(usd) < 0.01;
  const owes = cny > 0.01 || usd > 0.01;
  if (settled) return <Badge variant="secondary" className="text-green-700 bg-green-100">مسوّى</Badge>;
  if (owes) return <Badge variant="destructive">{cny > 0 ? `¥${fmt(cny)}` : ""}{cny > 0 && usd > 0 ? " + " : ""}{usd > 0 ? `$${fmt(usd)}` : ""}</Badge>;
  return <Badge className="bg-green-600 text-white">{cny < 0 ? `¥${fmt(Math.abs(cny))} مدفوع مسبقاً` : ""}{usd < 0 ? `$${fmt(Math.abs(usd))} مدفوع مسبقاً` : ""}</Badge>;
}

export default function AnnualInventory() {
  const { language } = useLanguage();
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("products");
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/annual-inventory", year],
    queryFn: () =>
      fetch(`/api/annual-inventory?year=${year}`, { credentials: "include" }).then((r) => r.json()),
  });

  const handlePrint = () => {
    if (!printRef.current) return;
    openPrintWindow({
      title: `جرد السنة ${year}`,
      content: printRef.current.innerHTML,
      dir: "rtl",
      lang: "ar",
    });
  };

  const fs = data?.financialSummary;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-annual-inventory-title">
            جرد السنة
          </h1>
          <p className="text-muted-foreground">تقرير شامل للنشاط السنوي</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Year picker */}
          <div className="flex items-center gap-1 border rounded-md px-2 py-1 bg-background">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setYear((y) => y - 1)}
              data-testid="button-prev-year"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg w-16 text-center" data-testid="text-selected-year">
              {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= new Date().getFullYear()}
              data-testid="button-next-year"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={handlePrint} data-testid="button-print-inventory">
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Content */}
      <div ref={printRef}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="products" data-testid="tab-products">
              <Package className="h-4 w-4 ml-1" />
              المنتجات
            </TabsTrigger>
            <TabsTrigger value="suppliers" data-testid="tab-suppliers">
              <Users className="h-4 w-4 ml-1" />
              الموردين
            </TabsTrigger>
            <TabsTrigger value="finance" data-testid="tab-finance">
              <Landmark className="h-4 w-4 ml-1" />
              المالية
            </TabsTrigger>
          </TabsList>

          {/* ===== PRODUCTS TAB ===== */}
          <TabsContent value="products">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5" />
                    جرد المنتجات — سنة {year}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-md border p-3 text-center">
                      <p className="text-xs text-muted-foreground">وارد السنة</p>
                      <p className="text-xl font-bold text-green-600">
                        {data?.productSummary?.reduce((s: number, p: any) => s + p.deliveredQty, 0) || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">قطعة</p>
                    </div>
                    <div className="rounded-md border p-3 text-center">
                      <p className="text-xs text-muted-foreground">صادر السنة</p>
                      <p className="text-xl font-bold text-orange-600">
                        {data?.productSummary?.reduce((s: number, p: any) => s + p.shippedQty, 0) || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">قطعة</p>
                    </div>
                    <div className="rounded-md border p-3 text-center">
                      <p className="text-xs text-muted-foreground">المخزون الحالي</p>
                      <p className="text-xl font-bold text-blue-600">
                        {data?.productSummary?.reduce((s: number, p: any) => s + p.currentStock, 0) || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">قطعة</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[500px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">#</TableHead>
                          <TableHead className="text-right">المنتج</TableHead>
                          <TableHead className="text-right">الفئة</TableHead>
                          <TableHead className="text-center text-green-700">وارد {year}</TableHead>
                          <TableHead className="text-center text-orange-700">صادر {year}</TableHead>
                          <TableHead className="text-center text-blue-700">المخزون الحالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!data?.productSummary?.length ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              لا توجد بيانات لهذه السنة
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.productSummary.map((p: any, idx: number) => (
                            <TableRow key={p.id} data-testid={`row-product-${p.id}`}>
                              <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell>
                                {p.categoryName ? (
                                  <Badge variant="secondary">{p.categoryName}</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center text-green-700 font-semibold">
                                {p.deliveredQty > 0 ? p.deliveredQty.toLocaleString() : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="text-center text-orange-700 font-semibold">
                                {p.shippedQty > 0 ? p.shippedQty.toLocaleString() : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-bold ${p.currentStock > 0 ? "text-blue-700" : "text-muted-foreground"}`}>
                                  {p.currentStock.toLocaleString()}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== SUPPLIERS TAB ===== */}
          <TabsContent value="suppliers">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5" />
                    جرد الموردين — الرصيد الفعلي الحالي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">#</TableHead>
                          <TableHead className="text-right">المورد</TableHead>
                          <TableHead className="text-center">تسليمات {year}</TableHead>
                          <TableHead className="text-center">قيمة مستلمة {year}</TableHead>
                          <TableHead className="text-center">مدفوع {year}</TableHead>
                          <TableHead className="text-center">إجمالي مستحق (كلي)</TableHead>
                          <TableHead className="text-center">إجمالي مدفوع (كلي)</TableHead>
                          <TableHead className="text-center">الرصيد الفعلي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!data?.supplierSummary?.length ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                              لا توجد بيانات
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.supplierSummary.map((s: any, idx: number) => (
                            <TableRow key={s.id} data-testid={`row-supplier-${s.id}`}>
                              <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                              <TableCell className="font-medium">{s.name}</TableCell>
                              <TableCell className="text-center">
                                {s.deliveryCountYear > 0 ? (
                                  <Badge variant="outline">{s.deliveryCountYear}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {s.deliveredYearCNY > 0 && <div>¥{fmt(s.deliveredYearCNY)}</div>}
                                {s.deliveredYearUSD > 0 && <div className="text-muted-foreground">${fmt(s.deliveredYearUSD)}</div>}
                                {s.deliveredYearCNY === 0 && s.deliveredYearUSD === 0 && <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {s.paidYearCNY > 0 && <div className="text-green-700">¥{fmt(s.paidYearCNY)}</div>}
                                {s.paidYearUSD > 0 && <div className="text-green-600">${fmt(s.paidYearUSD)}</div>}
                                {s.paidYearCNY === 0 && s.paidYearUSD === 0 && <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium">
                                {s.totalDelivCNY > 0 && <div>¥{fmt(s.totalDelivCNY)}</div>}
                                {s.totalDelivUSD > 0 && <div>${fmt(s.totalDelivUSD)}</div>}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium text-green-700">
                                {s.totalPaidCNY > 0 && <div>¥{fmt(s.totalPaidCNY)}</div>}
                                {s.totalPaidUSD > 0 && <div>${fmt(s.totalPaidUSD)}</div>}
                              </TableCell>
                              <TableCell className="text-center">
                                <BalanceBadge cny={s.balanceCNY} usd={s.balanceUSD} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== FINANCE TAB ===== */}
          <TabsContent value="finance">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !fs ? null : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Supplier payments */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        مدفوعات الموردين
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {fs.supplierPaymentsCNY > 0 && (
                        <div className="text-xl font-bold text-red-600">¥{fmt(fs.supplierPaymentsCNY)}</div>
                      )}
                      {fs.supplierPaymentsUSD > 0 && (
                        <div className="text-lg font-bold text-red-500">${fmt(fs.supplierPaymentsUSD)}</div>
                      )}
                      {fs.supplierPaymentsCNY === 0 && fs.supplierPaymentsUSD === 0 && (
                        <div className="text-muted-foreground text-sm">لا توجد مدفوعات</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Shipping payments */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        مدفوعات الشحن
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {fs.shippingPaymentsCNY > 0 && (
                        <div className="text-xl font-bold text-orange-600">¥{fmt(fs.shippingPaymentsCNY)}</div>
                      )}
                      {fs.shippingPaymentsUSD > 0 && (
                        <div className="text-lg font-bold text-orange-500">${fmt(fs.shippingPaymentsUSD)}</div>
                      )}
                      {fs.shippingPaymentsCNY === 0 && fs.shippingPaymentsUSD === 0 && (
                        <div className="text-muted-foreground text-sm">لا توجد مدفوعات</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Expenses */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        المصاريف
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {fs.expensesCNY > 0 && (
                        <div className="text-xl font-bold text-purple-600">¥{fmt(fs.expensesCNY)}</div>
                      )}
                      {fs.expensesUSD > 0 && (
                        <div className="text-lg font-bold text-purple-500">${fmt(fs.expensesUSD)}</div>
                      )}
                      {fs.expensesCNY === 0 && fs.expensesUSD === 0 && (
                        <div className="text-muted-foreground text-sm">لا توجد مصاريف</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cashbox income */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        إيرادات الصندوق
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {fs.cashboxIncomeCNY > 0 && (
                        <div className="text-xl font-bold text-green-600">¥{fmt(fs.cashboxIncomeCNY)}</div>
                      )}
                      {fs.cashboxIncomeUSD > 0 && (
                        <div className="text-lg font-bold text-green-500">${fmt(fs.cashboxIncomeUSD)}</div>
                      )}
                      {fs.cashboxIncomeCNY === 0 && fs.cashboxIncomeUSD === 0 && (
                        <div className="text-muted-foreground text-sm">لا توجد إيرادات</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cashbox expenses */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Minus className="h-4 w-4" />
                        مصاريف الصندوق
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {fs.cashboxExpenseCNY > 0 && (
                        <div className="text-xl font-bold text-red-600">¥{fmt(fs.cashboxExpenseCNY)}</div>
                      )}
                      {fs.cashboxExpenseUSD > 0 && (
                        <div className="text-lg font-bold text-red-500">${fmt(fs.cashboxExpenseUSD)}</div>
                      )}
                      {fs.cashboxExpenseCNY === 0 && fs.cashboxExpenseUSD === 0 && (
                        <div className="text-muted-foreground text-sm">لا توجد مصاريف</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Net cashbox */}
                  <Card className="border-2 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-primary" />
                        صافي الصندوق (¥)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {(() => {
                        const netCNY = fs.cashboxIncomeCNY - fs.cashboxExpenseCNY;
                        const netUSD = fs.cashboxIncomeUSD - fs.cashboxExpenseUSD;
                        return (
                          <>
                            {Math.abs(netCNY) > 0.01 && (
                              <div className={`text-xl font-bold ${netCNY >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {netCNY >= 0 ? "+" : ""}¥{fmt(netCNY)}
                              </div>
                            )}
                            {Math.abs(netUSD) > 0.01 && (
                              <div className={`text-lg font-bold ${netUSD >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {netUSD >= 0 ? "+" : ""}${fmt(netUSD)}
                              </div>
                            )}
                            {Math.abs(netCNY) < 0.01 && Math.abs(netUSD) < 0.01 && (
                              <div className="text-muted-foreground text-sm">لا توجد حركات</div>
                            )}
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}