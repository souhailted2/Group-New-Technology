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
import { Truck, Printer, Layers, Plus, Trash2, Pencil, ChevronDown, ChevronUp, Search } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  const [items, setItems] = useState<DeliveryItemDraft[]>([]);
  const [step, setStep] = useState<"supplier" | "items" | "summary">("supplier");
  const [expandedParts, setExpandedParts] = useState<number[]>([]);


  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  const { data: warehouses } = useQuery<WarehouseType[]>({
    queryKey: ["/api/warehouses"],
  });

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
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        piecesPerCarton: 0,
        parts: (item.parts || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity || 0,
          length: p.length,
          width: p.width,
          height: p.height,
          weight: p.weight,
          piecesPerCarton: p.piecesPerCarton,
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
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "تم تأكيد التسليم بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSupplierId("");
    setWarehouseId("");
    setItems([]);
    setStep("supplier");
    setExpandedParts([]);
  };

  const handleSelectSupplier = () => {
    if (!supplierId) {
      toast({ title: "يرجى اختيار المورد", variant: "destructive" });
      return;
    }
    fetchSupplierOrdersMutation.mutate(supplierId);
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const toggleSelect = (idx: number) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, selected: !item.selected } : item
    ));
  };

  const toggleExpandParts = (productId: number) => {
    setExpandedParts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const updatePart = (itemIdx: number, partIdx: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      const newParts = [...item.parts];
      newParts[partIdx] = { ...newParts[partIdx], [field]: value };
      return { ...item, parts: newParts };
    }));
  };

  const addPart = (itemIdx: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      return {
        ...item,
        parts: [...item.parts, { name: "", quantity: 0, length: null, width: null, height: null, weight: null, piecesPerCarton: null }],
      };
    }));
  };

  const removePart = (itemIdx: number, partIdx: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      return { ...item, parts: item.parts.filter((_, pi) => pi !== partIdx) };
    }));
  };

  const handleConfirm = () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) {
      toast({ title: "يرجى اختيار بضاعة واحدة على الأقل", variant: "destructive" });
      return;
    }
    setStep("summary");
  };

  const handleSubmit = () => {
    const selected = items.filter(i => i.selected);
    confirmDeliveryMutation.mutate({
      supplierId: parseInt(supplierId),
      warehouseId: parseInt(warehouseId),
      items: selected.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        currency: i.currency,
        length: i.length || null,
        width: i.width || null,
        height: i.height || null,
        weight: i.weight || null,
        piecesPerCarton: i.piecesPerCarton || null,
        parts: i.parts,
      })),
    });
  };

  const selectedItems = items.filter(i => i.selected);
  const totalCNY = selectedItems.filter(i => i.currency === "CNY").reduce((s, i) => s + (i.price * i.quantity), 0);
  const totalUSD = selectedItems.filter(i => i.currency === "USD").reduce((s, i) => s + (i.price * i.quantity), 0);

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
              <Truck className="h-4 w-4" />
              {t("deliveries.newDelivery", language)}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {step === "supplier" && "اختيار المورد"}
                {step === "items" && "تفاصيل البضاعة"}
                {step === "summary" && "ملخص التسليم"}
              </DialogTitle>
            </DialogHeader>

            {step === "supplier" && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>المورد</Label>
                  <SearchCombobox
                    selectedId={supplierId}
                    onSelect={(id) => setSupplierId(id)}
                    options={suppliers || []}
                    placeholder="اكتب لاختيار المورد..."
                    inputTestId="input-search-delivery-supplier"
                    optionTestIdPrefix="option-supplier"
                  />
                  {supplierId && (
                    <p className="text-xs text-green-600 mt-1">✓ {(suppliers || []).find(s => String(s.id) === supplierId)?.name}</p>
                  )}
                </div>
                <Button
                  data-testid="button-fetch-orders"
                  className="w-full"
                  onClick={handleSelectSupplier}
                  disabled={fetchSupplierOrdersMutation.isPending}
                >
                  {fetchSupplierOrdersMutation.isPending ? "جاري البحث..." : "عرض البضاعة"}
                </Button>
              </div>
            )}

            {step === "items" && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>المخزن</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger data-testid="select-delivery-warehouse">
                      <SelectValue placeholder={t("deliveries.selectWarehouse", language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((wh) => (
                        <SelectItem key={wh.id} value={String(wh.id)}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد بضائع مطلوبة
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        className="pr-9"
                        placeholder="بحث في السلع..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        data-testid="input-search-delivery-products"
                      />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="p-1 text-right"></th>
                            <th className="p-1 text-right">{t("common.product", language)}</th>
                            <th className="p-1 text-center">{t("common.quantity", language)}</th>
                            {!hidePrice && <th className="p-1 text-center">السعر</th>}
                            {!hidePrice && <th className="p-1 text-center">العملة</th>}
                            <th className="p-1 text-center">{t("deliveries.length", language)}</th>
                            <th className="p-1 text-center">{t("deliveries.width", language)}</th>
                            <th className="p-1 text-center">{t("deliveries.height", language)}</th>
                            <th className="p-1 text-center">{t("deliveries.weight", language)}</th>
                            <th className="p-1 text-center">{t("deliveries.pcsCarton", language)}</th>
                            <th className="p-1 text-center"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => ({ item, idx })).filter(({ item }) => !productSearch.trim() || item.productName.toLowerCase().includes(productSearch.toLowerCase()) || (item.productNameZh || "").toLowerCase().includes(productSearch.toLowerCase())).map(({ item, idx }) => (
                            <>
                              <tr key={item.productId} className={`border-b ${!item.selected ? "opacity-40" : ""}`}>
                                <td className="p-1">
                                  <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={() => toggleSelect(idx)}
                                    data-testid={`checkbox-item-${item.productId}`}
                                  />
                                </td>
                                <td className="p-1 font-medium whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <div>
                                      <span>{item.productName}</span>
                                      {item.productNameZh && (
                                        <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                                      )}
                                    </div>
                                    {item.productStatus === "semi_manufactured" && (
                                      <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-[10px] px-1">
                                        مركب
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-1">
                                  <input type="number" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.quantity}
                                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-quantity-${item.productId}`} />
                                </td>
                                {!hidePrice && <td className="p-1">
                                  <input type="number" step="0.01" className="w-14 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.price}
                                    onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-price-${item.productId}`} />
                                </td>}
                                {!hidePrice && <td className="p-1 text-center">{item.currency === "CNY" ? "¥" : "$"}</td>}
                                <td className="p-1">
                                  <input type="number" step="0.1" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.length || ""}
                                    onChange={(e) => updateItem(idx, "length", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-length-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  <input type="number" step="0.1" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.width || ""}
                                    onChange={(e) => updateItem(idx, "width", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-width-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  <input type="number" step="0.1" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.height || ""}
                                    onChange={(e) => updateItem(idx, "height", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-height-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  <input type="number" step="0.1" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.weight || ""}
                                    onChange={(e) => updateItem(idx, "weight", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-weight-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  <input type="number" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.piecesPerCarton || ""}
                                    onChange={(e) => updateItem(idx, "piecesPerCarton", parseInt(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-ppc-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  {item.selected && item.productStatus === "semi_manufactured" && (
                                    <Button size="icon" variant="ghost" onClick={() => toggleExpandParts(item.productId)}
                                      data-testid={`button-toggle-parts-${item.productId}`}>
                                      <Layers className="h-4 w-4 text-cyan-600" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                              {item.selected && item.productStatus === "semi_manufactured" && expandedParts.includes(item.productId) && (
                                <tr key={`parts-${item.productId}`}>
                                  <td colSpan={11} className="p-2">
                                    <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                                      <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-1">
                                          <Layers className="h-3 w-3 text-cyan-600" />
                                          {t("deliveries.parts", language)}: <span>{item.productName}</span>
                                          {item.productNameZh && (
                                            <span className="text-sm text-muted-foreground font-normal" dir="ltr">{item.productNameZh}</span>
                                          )}
                                        </h4>
                                        <Button size="sm" variant="outline" onClick={() => addPart(idx)} data-testid={`button-add-part-${item.productId}`}>
                                          <Plus className="h-3 w-3 ml-1" />
                                          إضافة جزء
                                        </Button>
                                      </div>
                                      {item.parts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-2">لا توجد أجزاء - اضغط إضافة جزء</p>
                                      ) : (
                                        <table className="w-full text-xs border-collapse">
                                          <thead>
                                            <tr className="border-b text-muted-foreground">
                                              <th className="p-1 text-right">الاسم</th>
                                              <th className="p-1 text-center">{t("common.quantity", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.length", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.width", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.height", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.weight", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.pcsCarton", language)}</th>
                                              <th className="p-1"></th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.parts.map((part, pi) => (
                                              <tr key={pi} className="border-b last:border-0">
                                                <td className="p-1">
                                                  <input value={part.name} onChange={(e) => updatePart(idx, pi, "name", e.target.value)}
                                                    className="w-20 border rounded px-1 py-0.5 text-xs bg-background" data-testid={`input-part-name-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" value={part.quantity || ""} onChange={(e) => updatePart(idx, pi, "quantity", parseInt(e.target.value) || 0)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-qty-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" step="0.1" value={part.length ?? ""} onChange={(e) => updatePart(idx, pi, "length", parseFloat(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-length-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" step="0.1" value={part.width ?? ""} onChange={(e) => updatePart(idx, pi, "width", parseFloat(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-width-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" step="0.1" value={part.height ?? ""} onChange={(e) => updatePart(idx, pi, "height", parseFloat(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-height-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" step="0.1" value={part.weight ?? ""} onChange={(e) => updatePart(idx, pi, "weight", parseFloat(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-weight-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" value={part.piecesPerCarton ?? ""} onChange={(e) => updatePart(idx, pi, "piecesPerCarton", parseInt(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-ppc-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <Button size="icon" variant="ghost" onClick={() => removePart(idx, pi)} data-testid={`button-remove-part-${item.productId}-${pi}`}>
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                  </Button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("supplier")}>رجوع</Button>
                  <Button onClick={handleConfirm} data-testid="button-confirm-delivery">تأكيد</Button>
                </div>
              </div>
            )}

            {step === "summary" && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    المورد: {suppliers?.find(s => s.id === parseInt(supplierId))?.name} |
                    المخزن: {warehouses?.find(w => w.id === parseInt(warehouseId))?.name}
                  </h3>
                  <Button variant="outline" size="icon" onClick={() => window.print()} data-testid="button-print-delivery">
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>

                <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.product", language)}</TableHead>
                      <TableHead>{t("common.quantity", language)}</TableHead>
                      {!hidePrice && <TableHead>السعر</TableHead>}
                      {!hidePrice && <TableHead>العملة</TableHead>}
                      {!hidePrice && <TableHead>المجموع</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            <div>
                              <span>{item.productName}</span>
                              {item.productNameZh && (
                                <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                              )}
                            </div>
                            {item.productStatus === "semi_manufactured" && (
                              <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-xs">
                                مركب
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        {!hidePrice && <TableCell>{item.price.toFixed(2)}</TableCell>}
                        {!hidePrice && <TableCell>{item.currency === "CNY" ? "يوان" : "دولار"}</TableCell>}
                        {!hidePrice && <TableCell className="font-semibold">{(item.price * item.quantity).toFixed(2)}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>

                {selectedItems.some(i => i.productStatus === "semi_manufactured" && i.parts.length > 0) && (
                  <div className="space-y-3">
                    {selectedItems.filter(i => i.productStatus === "semi_manufactured" && i.parts.length > 0).map((item) => (
                      <Card key={`parts-summary-${item.productId}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Layers className="h-4 w-4 text-cyan-600" />
                            {t("deliveries.parts", language)}: <span>{item.productName}</span>
                            {item.productNameZh && (
                              <span className="text-sm text-muted-foreground font-normal" dir="ltr">{item.productNameZh}</span>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                          <Table className="min-w-[600px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead>الجزء</TableHead>
                                <TableHead>{t("common.quantity", language)}</TableHead>
                                <TableHead>{t("deliveries.length", language)}</TableHead>
                                <TableHead>{t("deliveries.width", language)}</TableHead>
                                <TableHead>{t("deliveries.height", language)}</TableHead>
                                <TableHead>{t("deliveries.weight", language)}</TableHead>
                                <TableHead>{t("deliveries.pcsCarton", language)}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.parts.map((part, pi) => (
                                <TableRow key={pi}>
                                  <TableCell className="font-medium">{part.name}</TableCell>
                                  <TableCell>{part.quantity}</TableCell>
                                  <TableCell>{part.length ?? "-"}</TableCell>
                                  <TableCell>{part.width ?? "-"}</TableCell>
                                  <TableCell>{part.height ?? "-"}</TableCell>
                                  <TableCell>{part.weight ?? "-"}</TableCell>
                                  <TableCell>{part.piecesPerCarton ?? "-"}</TableCell>
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

                {!hidePrice && <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-semibold text-sm">المجاميع المالية</h4>
                      {totalCNY > 0 && (
                        <div className="flex justify-between"><span>يوان صيني:</span><span className="font-bold">{totalCNY.toFixed(2)} CNY</span></div>
                      )}
                      {totalUSD > 0 && (
                        <div className="flex justify-between"><span>دولار:</span><span className="font-bold">{totalUSD.toFixed(2)} USD</span></div>
                      )}
                    </CardContent>
                  </Card>
                </div>}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("items")}>رجوع</Button>
                  <Button onClick={handleSubmit} disabled={confirmDeliveryMutation.isPending} data-testid="button-submit-delivery">
                    {confirmDeliveryMutation.isPending ? "جاري التأكيد..." : t("deliveries.confirmDelivery", language)}
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
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
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
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-full" />
            </CardContent>
          </Card>
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
        <Card key={delivery.id} data-testid={`card-delivery-${delivery.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">
                تسليم #{delivery.id} - {delivery.supplierName || "مورد"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {delivery.warehouseName || "مخزن"}
                </Badge>
                {isAdmin && (
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7" onClick={() => setDeletingDelivery(delivery)} data-testid={`button-delete-delivery-${delivery.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString("fr-FR") : ""}
            </p>
          </CardHeader>
          {delivery.items && delivery.items.length > 0 && (
            <CardContent>
              <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.product", language)}</TableHead>
                    <TableHead>{t("common.quantity", language)}</TableHead>
                    {!hidePrice && <TableHead>السعر</TableHead>}
                    {!hidePrice && <TableHead>العملة</TableHead>}
                    {isAdmin && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delivery.items.map((item: any) => (
                    <TableRow key={item.id} data-testid={`row-delivery-item-${item.id}`}>
                      <TableCell>
                        <div>
                          <span>{item.productName || `منتج #${item.productId}`}</span>
                          {item.productNameZh && (
                            <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      {!hidePrice && <TableCell>{item.price?.toFixed(2)}</TableCell>}
                      {!hidePrice && <TableCell>{item.currency === "CNY" ? "يوان" : "دولار"}</TableCell>}
                      {isAdmin && <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => openItemEdit(item)} data-testid={`button-edit-delivery-item-${item.id}`}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </TableCell>}
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
              هل أنت متأكد من حذف تسليم #{deletingDelivery?.id} للمورد {deletingDelivery?.supplierName}؟ سيتم عكس الكميات في المخزون تلقائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletingDelivery && deleteDeliveryMutation.mutate(deletingDelivery.id)} disabled={deleteDeliveryMutation.isPending}>
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
              <p className="text-sm text-muted-foreground font-medium">{editingItem.productName}{editingItem.productNameZh && <span className="block" dir="ltr">{editingItem.productNameZh}</span>}</p>
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input autoFocus data-testid="input-edit-delivery-qty" type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
              </div>
              {!hidePrice && <div className="space-y-2">
                <Label>السعر</Label>
                <Input data-testid="input-edit-delivery-price" type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>}
              {!hidePrice && <div className="space-y-2">
                <Label>العملة</Label>
                <Select value={editCurrency} onValueChange={setEditCurrency}>
                  <SelectTrigger data-testid="select-edit-delivery-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNY">يوان صيني</SelectItem>
                    <SelectItem value="USD">دولار أمريكي</SelectItem>
                  </SelectContent>
                </Select>
              </div>}
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