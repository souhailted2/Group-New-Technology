import { useState } from "react";
import { SearchCombobox } from "@/components/search-combobox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Truck, Printer, Layers, Plus, Trash2, Pencil, Search, CalendarDays, Package, CheckCircle2, Building2, User, ChevronRight } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/App";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/translations";
import type { Supplier, Warehouse as WarehouseType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface PartDraft {
  id?: number;
  name: string;
  quantity: number;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  piecesPerCarton: number | null;
}

interface DeliveryItemDraft {
  productId: number;
  productName: string;
  productNameZh?: string | null;
  productStatus: string;
  selected: boolean;
  quantity: number;
  price: number;
  currency: "CNY" | "USD";
  length: number;
  width: number;
  height: number;
  weight: number;
  piecesPerCarton: number;
  parts: PartDraft[];
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const STEPS = [
  { key: "supplier", label: "المورد", icon: User },
  { key: "items",    label: "البضاعة", icon: Package },
  { key: "summary",  label: "المراجعة", icon: CheckCircle2 },
] as const;

function StepIndicator({ step }: { step: "supplier" | "items" | "summary" }) {
  const activeIdx = STEPS.findIndex(s => s.key === step);
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={s.key} className="flex items-center">
            <div className={`flex flex-col items-center gap-1 min-w-[60px]`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground"}`}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[11px] font-medium ${active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-10 mx-1 mb-4 transition-all ${i < activeIdx ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Deliveries() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const hidePrice = user?.role === "warehouse";
  const isAdmin = user?.role === "admin";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [receivedAt, setReceivedAt] = useState(todayStr());
  const [items, setItems] = useState<DeliveryItemDraft[]>([]);
  const [step, setStep] = useState<"supplier" | "items" | "summary">("supplier");
  const [expandedParts, setExpandedParts] = useState<number[]>([]);

  const { data: suppliers } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });
  const { data: warehouses } = useQuery<WarehouseType[]>({ queryKey: ["/api/warehouses"] });

  const fetchSupplierOrdersMutation = useMutation({
    mutationFn: async (sId: string) => {
      const res = await fetch(`/api/suppliers/${sId}/ordered-items`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    onSuccess: (data: any[]) => {
      const draftItems: DeliveryItemDraft[] = data.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        productNameZh: item.productNameZh || null,
        productStatus: item.productStatus || "ordered",
        selected: false,
        quantity: item.quantityOrdered,
        price: item.price,
        currency: item.currency,
        length: 0, width: 0, height: 0, weight: 0, piecesPerCarton: 0,
        parts: (item.parts || []).map((p: any) => ({
          id: p.id, name: p.name, quantity: p.quantity || 0,
          length: p.length, width: p.width, height: p.height,
          weight: p.weight, piecesPerCarton: p.piecesPerCarton,
        })),
      }));
      setItems(draftItems);
      setExpandedParts([]);
      if (warehouses && warehouses.length > 0 && !warehouseId) {
        setWarehouseId(String(warehouses[0].id));
      }
      setStep("items");
    },
    onError: () => {
      toast({ title: "لا توجد بضائع مطلوبة لهذا المورد", variant: "destructive" });
    },
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/deliveries", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"], refetchType: "all" });
      setDialogOpen(false);
      resetForm();
      toast({ title: "تم تأكيد التسليم بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSupplierId(""); setWarehouseId(""); setItems([]);
    setStep("supplier"); setExpandedParts([]);
    setReceivedAt(todayStr());
  };

  const updateItem = (idx: number, field: string, value: any) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const toggleSelect = (idx: number) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));

  const toggleExpandParts = (productId: number) =>
    setExpandedParts(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);

  const updatePart = (itemIdx: number, partIdx: number, field: string, value: any) =>
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      const newParts = [...item.parts];
      newParts[partIdx] = { ...newParts[partIdx], [field]: value };
      return { ...item, parts: newParts };
    }));

  const addPart = (itemIdx: number) =>
    setItems(prev => prev.map((item, i) =>
      i !== itemIdx ? item : { ...item, parts: [...item.parts, { name: "", quantity: 0, length: null, width: null, height: null, weight: null, piecesPerCarton: null }] }
    ));

  const removePart = (itemIdx: number, partIdx: number) =>
    setItems(prev => prev.map((item, i) =>
      i !== itemIdx ? item : { ...item, parts: item.parts.filter((_, pi) => pi !== partIdx) }
    ));

  const handleSelectSupplier = () => {
    if (!supplierId) { toast({ title: "يرجى اختيار المورد", variant: "destructive" }); return; }
    fetchSupplierOrdersMutation.mutate(supplierId);
  };

  const handleConfirm = () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) { toast({ title: "يرجى اختيار بضاعة واحدة على الأقل", variant: "destructive" }); return; }
    setStep("summary");
  };

  const handleSubmit = () => {
    const selected = items.filter(i => i.selected);
    confirmDeliveryMutation.mutate({
      supplierId: parseInt(supplierId),
      warehouseId: parseInt(warehouseId),
      receivedAt,
      items: selected.map(i => ({
        productId: i.productId, quantity: i.quantity, price: i.price, currency: i.currency,
        length: i.length || null, width: i.width || null, height: i.height || null,
        weight: i.weight || null, piecesPerCarton: i.piecesPerCarton || null, parts: i.parts,
      })),
    });
  };

  const selectedItems = items.filter(i => i.selected);
  const selectedSupplierName = (suppliers || []).find(s => String(s.id) === supplierId)?.name;
  const selectedWarehouseName = (warehouses || []).find(w => String(w.id) === warehouseId)?.name;
  const totalCNY = selectedItems.filter(i => i.currency === "CNY").reduce((s, i) => s + i.price * i.quantity, 0);
  const totalUSD = selectedItems.filter(i => i.currency === "USD").reduce((s, i) => s + i.price * i.quantity, 0);
  const filteredItems = items.filter(item =>
    !productSearch.trim() ||
    item.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    (item.productNameZh || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-deliveries-title">{t("deliveries.title", language)}</h1>
          <p className="text-muted-foreground">{t("deliveries.subtitle", language)}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-receive-delivery">
              <Truck className="h-4 w-4 ml-2" />
              {t("deliveries.newDelivery", language)}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-lg">تسليم بضاعة جديد</DialogTitle>
            </DialogHeader>

            <StepIndicator step={step} />

            {/* ── Step 1: Supplier ── */}
            {step === "supplier" && (
              <div className="space-y-6 pb-4">
                <div className="bg-muted/40 rounded-xl p-5 space-y-4 border">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-1">
                    <User className="h-4 w-4" /> اختيار المورد
                  </div>
                  <SearchCombobox
                    selectedId={supplierId}
                    onSelect={(id) => setSupplierId(id)}
                    options={suppliers || []}
                    placeholder="ابحث عن المورد..."
                    inputTestId="input-search-delivery-supplier"
                    optionTestIdPrefix="option-supplier"
                  />
                  {supplierId && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {selectedSupplierName}
                    </div>
                  )}
                </div>
                <Button
                  data-testid="button-fetch-orders"
                  className="w-full h-11 text-base"
                  onClick={handleSelectSupplier}
                  disabled={!supplierId || fetchSupplierOrdersMutation.isPending}
                >
                  {fetchSupplierOrdersMutation.isPending ? (
                    <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> جاري البحث...</span>
                  ) : (
                    <span className="flex items-center gap-2">عرض البضاعة <ChevronRight className="h-4 w-4" /></span>
                  )}
                </Button>
              </div>
            )}

            {/* ── Step 2: Items ── */}
            {step === "items" && (
              <div className="space-y-4 pb-4">
                {/* Supplier info bar */}
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 text-sm">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-primary">{selectedSupplierName}</span>
                  <span className="text-muted-foreground mr-auto">{items.filter(i=>i.selected).length} / {items.length} منتج مختار</span>
                </div>

                {/* Warehouse + Date row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <Building2 className="h-3.5 w-3.5" /> المخزن
                    </Label>
                    <Select value={warehouseId} onValueChange={setWarehouseId}>
                      <SelectTrigger data-testid="select-delivery-warehouse" className="h-10">
                        <SelectValue placeholder={t("deliveries.selectWarehouse", language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses?.map((wh) => (
                          <SelectItem key={wh.id} value={String(wh.id)}>{wh.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <CalendarDays className="h-3.5 w-3.5" /> تاريخ الاستلام
                    </Label>
                    <Input
                      type="date"
                      value={receivedAt}
                      onChange={(e) => setReceivedAt(e.target.value)}
                      className="h-10"
                      data-testid="input-received-at"
                    />
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pr-9 h-9"
                    placeholder="بحث في السلع..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    data-testid="input-search-delivery-products"
                  />
                </div>

                {/* Products list */}
                {items.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">لا توجد بضائع مطلوبة</div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {filteredItems.map((item, rawIdx) => {
                      const idx = items.findIndex(i => i.productId === item.productId);
                      return (
                        <div key={item.productId}>
                          <div
                            className={`rounded-xl border transition-all ${item.selected
                              ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                              : "border-border bg-card opacity-60 hover:opacity-80"}`}
                          >
                            {/* Product header row */}
                            <div className="flex items-start gap-3 p-3">
                              <Checkbox
                                checked={item.selected}
                                onCheckedChange={() => toggleSelect(idx)}
                                className="mt-0.5"
                                data-testid={`checkbox-item-${item.productId}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm">{item.productName}</span>
                                  {item.productNameZh && (
                                    <span className="text-xs text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                                  )}
                                  {item.productStatus === "semi_manufactured" && (
                                    <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-[10px] px-1.5">مركب</Badge>
                                  )}
                                </div>

                                {/* Fields row */}
                                {item.selected && (
                                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                    <div>
                                      <p className="text-[10px] text-muted-foreground mb-0.5">{t("common.quantity", language)}</p>
                                      <input type="number" className="w-full border rounded-lg px-2 py-1.5 text-center text-sm bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                                        data-testid={`input-quantity-${item.productId}`} />
                                    </div>
                                    {!hidePrice && (
                                      <div>
                                        <p className="text-[10px] text-muted-foreground mb-0.5">السعر</p>
                                        <input type="number" step="0.01" className="w-full border rounded-lg px-2 py-1.5 text-center text-sm bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                          value={item.price}
                                          onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                                          data-testid={`input-price-${item.productId}`} />
                                      </div>
                                    )}
                                    {!hidePrice && (
                                      <div>
                                        <p className="text-[10px] text-muted-foreground mb-0.5">العملة</p>
                                        <select
                                          className="w-full border rounded-lg px-2 py-1.5 text-sm bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                          value={item.currency}
                                          onChange={(e) => updateItem(idx, "currency", e.target.value)}
                                          data-testid={`select-currency-${item.productId}`}
                                        >
                                          <option value="CNY">يوان ¥</option>
                                          <option value="USD">دولار $</option>
                                        </select>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-[10px] text-muted-foreground mb-0.5">ط×ع×ا (سم)</p>
                                      <div className="flex gap-1">
                                        <input type="number" step="0.1" placeholder="ط" className="w-full border rounded-lg px-1 py-1.5 text-center text-xs bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                          value={item.length || ""} onChange={(e) => updateItem(idx, "length", parseFloat(e.target.value) || 0)}
                                          data-testid={`input-length-${item.productId}`} />
                                        <input type="number" step="0.1" placeholder="ع" className="w-full border rounded-lg px-1 py-1.5 text-center text-xs bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                          value={item.width || ""} onChange={(e) => updateItem(idx, "width", parseFloat(e.target.value) || 0)}
                                          data-testid={`input-width-${item.productId}`} />
                                        <input type="number" step="0.1" placeholder="ا" className="w-full border rounded-lg px-1 py-1.5 text-center text-xs bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                          value={item.height || ""} onChange={(e) => updateItem(idx, "height", parseFloat(e.target.value) || 0)}
                                          data-testid={`input-height-${item.productId}`} />
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-muted-foreground mb-0.5">وزن / كرتون</p>
                                      <div className="flex gap-1">
                                        <input type="number" step="0.1" placeholder="كغ" className="w-full border rounded-lg px-1 py-1.5 text-center text-xs bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                          value={item.weight || ""} onChange={(e) => updateItem(idx, "weight", parseFloat(e.target.value) || 0)}
                                          data-testid={`input-weight-${item.productId}`} />
                                        <input type="number" placeholder="قطعة" className="w-full border rounded-lg px-1 py-1.5 text-center text-xs bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                                          value={item.piecesPerCarton || ""} onChange={(e) => updateItem(idx, "piecesPerCarton", parseInt(e.target.value) || 0)}
                                          data-testid={`input-ppc-${item.productId}`} />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Price summary badge */}
                              {item.selected && !hidePrice && (
                                <div className="shrink-0 text-right">
                                  <p className="text-xs text-muted-foreground">الإجمالي</p>
                                  <p className="text-sm font-bold text-primary">
                                    {(item.price * item.quantity).toFixed(0)} {item.currency === "CNY" ? "¥" : "$"}
                                  </p>
                                </div>
                              )}

                              {/* Parts toggle */}
                              {item.selected && item.productStatus === "semi_manufactured" && (
                                <Button size="icon" variant="ghost" className="shrink-0" onClick={() => toggleExpandParts(item.productId)}
                                  data-testid={`button-toggle-parts-${item.productId}`}>
                                  <Layers className="h-4 w-4 text-cyan-600" />
                                </Button>
                              )}
                            </div>

                            {/* Parts section */}
                            {item.selected && item.productStatus === "semi_manufactured" && expandedParts.includes(item.productId) && (
                              <div className="border-t mx-3 mb-3 pt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-xs font-semibold flex items-center gap-1 text-cyan-700 dark:text-cyan-400">
                                    <Layers className="h-3 w-3" /> أجزاء: {item.productName}
                                  </h4>
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addPart(idx)} data-testid={`button-add-part-${item.productId}`}>
                                    <Plus className="h-3 w-3 ml-1" /> إضافة جزء
                                  </Button>
                                </div>
                                {item.parts.length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-2">لا توجد أجزاء — اضغط إضافة جزء</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {item.parts.map((part, pi) => (
                                      <div key={pi} className="grid grid-cols-8 gap-1 items-center">
                                        <input value={part.name} onChange={(e) => updatePart(idx, pi, "name", e.target.value)} placeholder="الاسم"
                                          className="col-span-2 border rounded px-1.5 py-1 text-xs bg-background" data-testid={`input-part-name-${item.productId}-${pi}`} />
                                        {[
                                          { field: "quantity", ph: "كمية", type: "number" },
                                          { field: "length", ph: "طول", type: "number" },
                                          { field: "width", ph: "عرض", type: "number" },
                                          { field: "height", ph: "ارتفاع", type: "number" },
                                          { field: "weight", ph: "وزن", type: "number" },
                                          { field: "piecesPerCarton", ph: "ق/كرتون", type: "number" },
                                        ].map(f => (
                                          <input key={f.field} type={f.type} step="0.1" placeholder={f.ph}
                                            value={(part as any)[f.field] ?? ""}
                                            onChange={(e) => updatePart(idx, pi, f.field, f.field === "quantity" || f.field === "piecesPerCarton" ? parseInt(e.target.value) || null : parseFloat(e.target.value) || null)}
                                            className="border rounded px-1 py-1 text-center text-xs bg-background"
                                            data-testid={`input-part-${f.field}-${item.productId}-${pi}`} />
                                        ))}
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removePart(idx, pi)}>
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer totals + actions */}
                {!hidePrice && items.some(i => i.selected) && (
                  <div className="flex gap-3 bg-muted/50 rounded-lg px-4 py-2 text-sm border flex-wrap">
                    {totalCNY > 0 && <span className="font-semibold">يوان: <span className="text-primary">{totalCNY.toFixed(2)} ¥</span></span>}
                    {totalUSD > 0 && <span className="font-semibold">دولار: <span className="text-primary">{totalUSD.toFixed(2)} $</span></span>}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setStep("supplier")}>رجوع</Button>
                  <Button className="flex-1 h-10" onClick={handleConfirm} data-testid="button-confirm-delivery">
                    مراجعة التسليم <ChevronRight className="h-4 w-4 mr-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Summary ── */}
            {step === "summary" && (
              <div className="space-y-4 pb-4">
                {/* Info cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/40 border rounded-xl p-3 text-center">
                    <User className="h-4 w-4 mx-auto text-primary mb-1" />
                    <p className="text-[10px] text-muted-foreground">المورد</p>
                    <p className="text-sm font-semibold truncate">{selectedSupplierName}</p>
                  </div>
                  <div className="bg-muted/40 border rounded-xl p-3 text-center">
                    <Building2 className="h-4 w-4 mx-auto text-primary mb-1" />
                    <p className="text-[10px] text-muted-foreground">المخزن</p>
                    <p className="text-sm font-semibold truncate">{selectedWarehouseName}</p>
                  </div>
                  <div className="bg-muted/40 border rounded-xl p-3 text-center">
                    <CalendarDays className="h-4 w-4 mx-auto text-primary mb-1" />
                    <p className="text-[10px] text-muted-foreground">تاريخ الاستلام</p>
                    <p className="text-sm font-semibold">{receivedAt ? new Date(receivedAt).toLocaleDateString("fr-FR") : "-"}</p>
                  </div>
                </div>

                {/* Products table */}
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">{t("common.product", language)}</TableHead>
                        <TableHead className="text-center font-semibold">{t("common.quantity", language)}</TableHead>
                        {!hidePrice && <TableHead className="text-center font-semibold">السعر</TableHead>}
                        {!hidePrice && <TableHead className="text-center font-semibold">العملة</TableHead>}
                        {!hidePrice && <TableHead className="text-center font-semibold">المجموع</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItems.map((item) => (
                        <TableRow key={item.productId} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div>
                                <span>{item.productName}</span>
                                {item.productNameZh && (
                                  <span className="block text-xs text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                                )}
                              </div>
                              {item.productStatus === "semi_manufactured" && (
                                <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-xs">مركب</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          {!hidePrice && <TableCell className="text-center">{item.price.toFixed(2)}</TableCell>}
                          {!hidePrice && <TableCell className="text-center">{item.currency === "CNY" ? "يوان ¥" : "دولار $"}</TableCell>}
                          {!hidePrice && <TableCell className="text-center font-semibold text-primary">{(item.price * item.quantity).toFixed(2)}</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Parts summary */}
                {selectedItems.some(i => i.productStatus === "semi_manufactured" && i.parts.length > 0) && (
                  <div className="space-y-2">
                    {selectedItems.filter(i => i.productStatus === "semi_manufactured" && i.parts.length > 0).map((item) => (
                      <Card key={`parts-summary-${item.productId}`} className="border-cyan-200 dark:border-cyan-800">
                        <CardHeader className="pb-2 pt-3">
                          <CardTitle className="text-sm flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                            <Layers className="h-4 w-4" /> أجزاء: {item.productName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="overflow-x-auto">
                            <Table className="min-w-[500px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>الجزء</TableHead>
                                  <TableHead className="text-center">الكمية</TableHead>
                                  <TableHead className="text-center">ط</TableHead>
                                  <TableHead className="text-center">ع</TableHead>
                                  <TableHead className="text-center">ا</TableHead>
                                  <TableHead className="text-center">وزن</TableHead>
                                  <TableHead className="text-center">ق/كرتون</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {item.parts.map((part, pi) => (
                                  <TableRow key={pi}>
                                    <TableCell className="font-medium">{part.name}</TableCell>
                                    <TableCell className="text-center">{part.quantity}</TableCell>
                                    <TableCell className="text-center">{part.length ?? "-"}</TableCell>
                                    <TableCell className="text-center">{part.width ?? "-"}</TableCell>
                                    <TableCell className="text-center">{part.height ?? "-"}</TableCell>
                                    <TableCell className="text-center">{part.weight ?? "-"}</TableCell>
                                    <TableCell className="text-center">{part.piecesPerCarton ?? "-"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Totals */}
                {!hidePrice && (totalCNY > 0 || totalUSD > 0) && (
                  <div className="grid grid-cols-2 gap-3">
                    {totalCNY > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">إجمالي يوان</p>
                        <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{totalCNY.toFixed(2)} ¥</p>
                      </div>
                    )}
                    {totalUSD > 0 && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">إجمالي دولار</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{totalUSD.toFixed(2)} $</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setStep("items")}>تعديل</Button>
                  <Button
                    className="flex-1 h-11 text-base"
                    onClick={handleSubmit}
                    disabled={confirmDeliveryMutation.isPending}
                    data-testid="button-submit-delivery"
                  >
                    {confirmDeliveryMutation.isPending ? (
                      <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> جاري التأكيد...</span>
                    ) : (
                      <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> تأكيد الاستلام</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <DeliveriesHistory />
    </div>
  );
}

function DeliveriesHistory() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const hidePrice = user?.role === "warehouse";
  const isAdmin = user?.role === "admin";
  const [searchDelivery, setSearchDelivery] = useState("");
  const [deletingDelivery, setDeletingDelivery] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCurrency, setEditCurrency] = useState("CNY");
  const { toast } = useToast();

  const { data: deliveriesList, isLoading } = useQuery<any[]>({
    queryKey: ["/api/deliveries"],
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/deliveries/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"], refetchType: "all" });
      setDeletingDelivery(null);
      toast({ title: "تم حذف التسليم وتصحيح المخزون" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateDeliveryItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/delivery-items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"], refetchType: "all" });
      setEditingItem(null);
      toast({ title: "تم تحديث البند بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const openItemEdit = (item: any) => {
    setEditingItem(item);
    setEditQty(String(item.quantity));
    setEditPrice(String(item.price || 0));
    setEditCurrency(item.currency || "CNY");
  };

  const saveItemEdit = () => {
    if (!editingItem) return;
    updateDeliveryItemMutation.mutate({
      id: editingItem.id,
      data: {
        quantity: parseInt(editQty) || editingItem.quantity,
        price: parseFloat(editPrice) || 0,
        currency: editCurrency,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!deliveriesList || deliveriesList.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Truck className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t("deliveries.noDeliveries", language)}</p>
        </CardContent>
      </Card>
    );
  }

  const filteredDeliveries = (deliveriesList || []).filter((d: any) =>
    !searchDelivery.trim() || (d.supplierName || "").toLowerCase().includes(searchDelivery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">{t("deliveries.deliveryHistory", language)}</h2>
        <div className="relative w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="بحث بالمورد..."
            value={searchDelivery}
            onChange={(e) => setSearchDelivery(e.target.value)}
            className="pr-9"
            data-testid="input-search-deliveries-history"
          />
        </div>
      </div>

      {filteredDeliveries.map((delivery: any) => (
        <Card key={delivery.id} data-testid={`card-delivery-${delivery.id}`} className="overflow-hidden">
          <CardHeader className="pb-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  تسليم #{delivery.id}
                </CardTitle>
                <Badge variant="outline" className="font-medium">{delivery.supplierName || "مورد"}</Badge>
                <Badge variant="secondary">{delivery.warehouseName || "مخزن"}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {delivery.receivedAt
                    ? new Date(delivery.receivedAt).toLocaleDateString("fr-FR")
                    : delivery.createdAt
                      ? new Date(delivery.createdAt).toLocaleDateString("fr-FR")
                      : ""}
                </div>
                {isAdmin && (
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                    onClick={() => setDeletingDelivery(delivery)} data-testid={`button-delete-delivery-${delivery.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          {delivery.items && delivery.items.length > 0 && (
            <CardContent className="pt-3">
              <div className="overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.product", language)}</TableHead>
                      <TableHead className="text-center">{t("common.quantity", language)}</TableHead>
                      {!hidePrice && <TableHead className="text-center">السعر</TableHead>}
                      {!hidePrice && <TableHead className="text-center">العملة</TableHead>}
                      {isAdmin && <TableHead></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delivery.items.map((item: any) => (
                      <TableRow key={item.id} data-testid={`row-delivery-item-${item.id}`}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.productName || `منتج #${item.productId}`}</span>
                            {item.productNameZh && (
                              <span className="block text-xs text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{item.quantity}</TableCell>
                        {!hidePrice && <TableCell className="text-center">{item.price?.toFixed(2)}</TableCell>}
                        {!hidePrice && <TableCell className="text-center">{item.currency === "CNY" ? "يوان ¥" : "دولار $"}</TableCell>}
                        {isAdmin && (
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => openItemEdit(item)} data-testid={`button-edit-delivery-item-${item.id}`}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      <AlertDialog open={!!deletingDelivery} onOpenChange={(open) => { if (!open) setDeletingDelivery(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التسليم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف تسليم #{deletingDelivery?.id} للمورد {deletingDelivery?.supplierName}؟
              سيتم عكس الكميات في المخزون تلقائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingDelivery && deleteDeliveryMutation.mutate(deletingDelivery.id)}
              disabled={deleteDeliveryMutation.isPending}
            >
              {deleteDeliveryMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بند التسليم</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 pt-4">
              <p className="text-sm font-medium text-muted-foreground">
                {editingItem.productName}
                {editingItem.productNameZh && <span className="block" dir="ltr">{editingItem.productNameZh}</span>}
              </p>
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input autoFocus data-testid="input-edit-delivery-qty" type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
              </div>
              {!hidePrice && (
                <div className="space-y-2">
                  <Label>السعر</Label>
                  <Input data-testid="input-edit-delivery-price" type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                </div>
              )}
              {!hidePrice && (
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select value={editCurrency} onValueChange={setEditCurrency}>
                    <SelectTrigger data-testid="select-edit-delivery-currency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY">يوان صيني ¥</SelectItem>
                      <SelectItem value="USD">دولار أمريكي $</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full" onClick={saveItemEdit} disabled={updateDeliveryItemMutation.isPending} data-testid="button-save-edit-delivery-item">
                {updateDeliveryItemMutation.isPending ? "جاري الحفظ..." : "حفظ التعديل"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
