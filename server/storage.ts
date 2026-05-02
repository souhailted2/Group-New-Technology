import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "./db";
import {
  categories, suppliers, warehouses, products, orders, orderItems,
  deliveries, deliveryItems, containers, containerItems, payments, users, productParts, userCategories,
  shippingCompanies, shippingPayments, cashboxTransactions, expenses, containerDocuments,
  type InsertCategory, type Category,
  type InsertSupplier, type Supplier,
  type InsertShippingCompany, type ShippingCompany,
  type InsertWarehouse, type Warehouse,
  type InsertProduct, type Product,
  type InsertOrder, type Order,
  type InsertOrderItem, type OrderItem,
  type InsertDelivery, type Delivery,
  type InsertDeliveryItem, type DeliveryItem,
  type InsertContainer, type Container,
  type InsertContainerItem, type ContainerItem,
  type InsertPayment, type Payment,
  type InsertShippingPayment, type ShippingPayment,
  type InsertUser, type User,
  type InsertProductPart, type ProductPart,
  type UserCategory,
  type InsertCashboxTransaction, type CashboxTransaction,
  type InsertExpense, type Expense,
} from "@shared/schema";

export interface IStorage {
  getCategories(): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  getShippingCompanies(): Promise<ShippingCompany[]>;
  createShippingCompany(data: InsertShippingCompany): Promise<ShippingCompany>;
  updateShippingCompany(id: number, data: Partial<InsertShippingCompany>): Promise<ShippingCompany | undefined>;
  deleteShippingCompany(id: number): Promise<void>;
  getWarehouses(): Promise<Warehouse[]>;
  createWarehouse(data: InsertWarehouse): Promise<Warehouse>;
  getProducts(): Promise<Product[]>;
  getProductsByStatus(status: string): Promise<Product[]>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProductStatus(id: number, status: string): Promise<Product | undefined>;
  getOrders(): Promise<any[]>;
  createOrder(supplierId: number, items: any[]): Promise<Order>;
  updateOrderItem(itemId: number, data: any): Promise<any>;
  confirmOrder(id: number): Promise<Order>;
  getSupplierOrderedItems(supplierId: number): Promise<any[]>;
  createDelivery(supplierId: number, warehouseId: number, items: any[]): Promise<Delivery>;
  getDeliveries(): Promise<any[]>;
  getContainers(): Promise<any[]>;
  createContainer(data: any, items: any[]): Promise<Container>;
  updateContainer(id: number, data: any): Promise<Container | undefined>;
  markContainerArrived(containerId: number): Promise<Container | undefined>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<void>;
  deleteCategory(id: number): Promise<void>;
  getSupplierAccount(supplierId: number): Promise<any>;
  getAnnualInventory(year: number): Promise<any>;
  deleteOrder(id: number): Promise<void>;
  deleteOrderItem(id: number): Promise<void>;
  deleteDelivery(id: number): Promise<void>;
  updateDeliveryItem(id: number, data: any): Promise<any>;
  deleteContainer(id: number): Promise<void>;
  updateContainerItem(id: number, newQty: number): Promise<any>;
  deleteContainerItem(id: number): Promise<void>;
  getShippingCompanyAccount(companyId: number): Promise<any>;
  getDashboardSummary(): Promise<any>;
  createPayment(data: InsertPayment): Promise<Payment>;
  updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<void>;
  createShippingPayment(data: InsertShippingPayment): Promise<ShippingPayment>;
  updateShippingPayment(id: number, data: Partial<InsertShippingPayment>): Promise<ShippingPayment | undefined>;
  deleteShippingPayment(id: number): Promise<void>;
  getProductParts(productId: number): Promise<ProductPart[]>;
  createProductPart(data: InsertProductPart): Promise<ProductPart>;
  deleteProductPart(id: number): Promise<void>;
  getWarehouseInventory(): Promise<any[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<{ username: string; password: string; displayName: string }>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserCategories(userId: number): Promise<number[]>;
  setUserCategories(userId: number, categoryIds: number[]): Promise<void>;
  getCashboxTransactions(): Promise<any[]>;
  getCashboxSummary(): Promise<any>;
  createCashboxTransaction(data: InsertCashboxTransaction): Promise<CashboxTransaction>;
  updateCashboxTransaction(id: number, data: Partial<InsertCashboxTransaction>): Promise<CashboxTransaction | undefined>;
  deleteCashboxTransaction(id: number): Promise<void>;
  getExpenses(): Promise<Expense[]>;
  createExpense(data: InsertExpense): Promise<Expense>;
  updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<void>;
  getCashboxByExpenseId(expenseId: number): Promise<CashboxTransaction | undefined>;
  deleteCashboxByExpenseId(expenseId: number): Promise<void>;
  updateCashboxByExpenseId(expenseId: number, data: Partial<InsertCashboxTransaction>): Promise<CashboxTransaction | undefined>;
  getContainerDocuments(): Promise<any[]>;
  getContainerDocument(id: number): Promise<any>;
  updateContainerDocument(id: number, data: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [cat] = await db.insert(categories).values(data).returning();
    return cat;
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [cat] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return cat;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [sup] = await db.insert(suppliers).values(data).returning();
    return sup;
  }

  async getShippingCompanies(): Promise<ShippingCompany[]> {
    return db.select().from(shippingCompanies);
  }

  async createShippingCompany(data: InsertShippingCompany): Promise<ShippingCompany> {
    const [sc] = await db.insert(shippingCompanies).values(data).returning();
    return sc;
  }

  async updateShippingCompany(id: number, data: Partial<InsertShippingCompany>): Promise<ShippingCompany | undefined> {
    const [updated] = await db.update(shippingCompanies).set(data).where(eq(shippingCompanies.id, id)).returning();
    return updated;
  }

  async deleteShippingCompany(id: number): Promise<void> {
    const relatedContainers = await db.select().from(containers).where(eq(containers.shippingCompanyId, id));
    const relatedPayments = await db.select().from(shippingPayments).where(eq(shippingPayments.shippingCompanyId, id));
    if (relatedContainers.length > 0 || relatedPayments.length > 0) {
      throw new Error("لا يمكن حذف شركة الشحن لوجود عمليات مرتبطة بها");
    }
    await db.delete(shippingCompanies).where(eq(shippingCompanies.id, id));
  }

  async getWarehouses(): Promise<Warehouse[]> {
    return db.select().from(warehouses);
  }

  async createWarehouse(data: InsertWarehouse): Promise<Warehouse> {
    const [wh] = await db.insert(warehouses).values(data).returning();
    return wh;
  }

  async updateWarehouse(id: number, data: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const [updated] = await db.update(warehouses).set(data).where(eq(warehouses.id, id)).returning();
    return updated;
  }

  async deleteWarehouse(id: number): Promise<void> {
    const relatedDeliveries = await db.select().from(deliveries).where(eq(deliveries.warehouseId, id));
    const relatedContainers = await db.select().from(containers).where(eq(containers.warehouseId, id));
    if (relatedDeliveries.length > 0 || relatedContainers.length > 0) {
      throw new Error("لا يمكن حذف المخزن لوجود تسليمات أو حاويات مرتبطة به");
    }
    await db.delete(warehouses).where(eq(warehouses.id, id));
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getProductsByStatus(status: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.status, status as any));
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const existing = await db.select().from(products)
      .where(and(eq(products.name, data.name), eq(products.status, "purchase_order")));
    if (existing.length > 0) {
      const old = existing[0];
      const newQty = (old.quantity || 0) + (data.quantity || 0);
      const [updated] = await db.update(products).set({ quantity: newQty }).where(eq(products.id, old.id)).returning();
      return updated;
    }
    const [prod] = await db.insert(products).values({
      ...data,
      status: data.status || "purchase_order",
    }).returning();
    return prod;
  }

  async updateProductStatus(id: number, status: string): Promise<Product | undefined> {
    const [prod] = await db.update(products)
      .set({ status: status as any, statusChangedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return prod;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.productId, id));
    await db.delete(deliveryItems).where(eq(deliveryItems.productId, id));
    await db.delete(containerItems).where(eq(containerItems.productId, id));
    await db.delete(productParts).where(eq(productParts.productId, id));
    await db.delete(products).where(eq(products.id, id));
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async deleteSupplier(id: number): Promise<void> {
    const relatedOrders = await db.select().from(orders).where(eq(orders.supplierId, id));
    const relatedDeliveries = await db.select().from(deliveries).where(eq(deliveries.supplierId, id));
    const relatedPayments = await db.select().from(payments).where(eq(payments.supplierId, id));
    if (relatedOrders.length > 0 || relatedDeliveries.length > 0 || relatedPayments.length > 0) {
      throw new Error("لا يمكن حذف المورد لوجود عمليات مرتبطة به (طلبات، تسليمات، أو دفعات)");
    }
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async deleteCategory(id: number): Promise<void> {
    const relatedProducts = await db.select().from(products).where(eq(products.categoryId, id));
    if (relatedProducts.length > 0) {
      throw new Error("لا يمكن حذف الفئة لوجود منتجات مرتبطة بها");
    }
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getOrders(): Promise<any[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.id));
    const result = [];
    for (const order of allOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const sup = await db.select().from(suppliers).where(eq(suppliers.id, order.supplierId));
      const enrichedItems = [];
      for (const item of items) {
        const prods = await db.select().from(products).where(eq(products.id, item.productId));
        enrichedItems.push({
          ...item,
          productName: prods[0]?.name || `منتج #${item.productId}`,
          productNameZh: prods[0]?.nameZh || null,
        });
      }
      result.push({
        ...order,
        supplierName: sup[0]?.name || "",
        items: enrichedItems,
      });
    }
    return result;
  }

  async createOrder(supplierId: number, items: any[]): Promise<Order> {
    const [order] = await db.insert(orders).values({
      supplierId,
      confirmed: "confirmed",
    }).returning();

    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantityRequested: item.quantityRequested,
        quantityOrdered: item.quantityOrdered,
        price: item.price,
        currency: item.currency,
      });

      const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
      if (prod) {
        const remaining = prod.quantity - item.quantityOrdered;
        if (remaining <= 0) {
          await db.update(products)
            .set({ status: "ordered", statusChangedAt: new Date(), quantity: item.quantityOrdered })
            .where(eq(products.id, item.productId));
        } else {
          await db.update(products)
            .set({ status: "ordered", statusChangedAt: new Date(), quantity: item.quantityOrdered })
            .where(eq(products.id, item.productId));

          const [newProd] = await db.insert(products).values({
            name: prod.name,
            quantity: remaining,
            categoryId: prod.categoryId,
            status: "purchase_order",
            statusChangedAt: new Date(),
          }).returning();

          if (prod.status === "semi_manufactured") {
            const existingParts = await db.select().from(productParts).where(eq(productParts.productId, item.productId));
            for (const part of existingParts) {
              await db.insert(productParts).values({
                productId: newProd.id,
                name: part.name,
                quantity: part.quantity,
                length: part.length,
                width: part.width,
                height: part.height,
                weight: part.weight,
                piecesPerCarton: part.piecesPerCarton,
              });
            }
          }
        }
      }
    }

    return order;
  }

  async updateOrderItem(itemId: number, data: any): Promise<any> {
    const updateData: Record<string, any> = {};
    if (data.quantityRequested !== undefined) updateData.quantityRequested = data.quantityRequested;
    if (data.quantityOrdered !== undefined) updateData.quantityOrdered = data.quantityOrdered;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    const [updated] = await db.update(orderItems).set(updateData).where(eq(orderItems.id, itemId)).returning();
    return updated;
  }

  async confirmOrder(id: number): Promise<Order> {
    const [updated] = await db.update(orders).set({ confirmed: "confirmed" }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getSupplierOrderedItems(supplierId: number): Promise<any[]> {
    const supplierOrders = await db.select().from(orders)
      .where(and(eq(orders.supplierId, supplierId), eq(orders.confirmed, "confirmed")));

    const result = [];
    for (const order of supplierOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      for (const item of items) {
        const prods = await db.select().from(products).where(eq(products.id, item.productId));
        if (prods[0] && (prods[0].status === "ordered" || prods[0].status === "semi_manufactured")) {
          const parts = prods[0].status === "semi_manufactured"
            ? await db.select().from(productParts).where(eq(productParts.productId, item.productId))
            : [];
          result.push({
            ...item,
            quantityOrdered: prods[0].quantity,
            productName: prods[0].name,
            productNameZh: prods[0].nameZh || null,
            productStatus: prods[0].status,
            parts,
          });
        }
      }
    }
    return result;
  }

  async createDelivery(supplierId: number, warehouseId: number, items: any[], receivedAt?: Date): Promise<Delivery> {
    const [delivery] = await db.insert(deliveries).values({
      supplierId,
      warehouseId,
      receivedAt: receivedAt || new Date(),
    }).returning();

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) continue;

      await db.insert(deliveryItems).values({
        deliveryId: delivery.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        length: item.length,
        width: item.width,
        height: item.height,
        weight: item.weight,
        piecesPerCarton: item.piecesPerCarton,
      });

      const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
      const orderedQty = prod?.quantity || 0;
      const receivedQty = item.quantity || 0;
      const remaining = orderedQty - receivedQty;

      if (remaining > 0) {
        // Partial delivery - keep product as "ordered" with remaining quantity
        await db.update(products)
          .set({ quantity: remaining })
          .where(eq(products.id, item.productId));
      } else {
        // Full delivery - mark as received
        const newStatus = prod.status === "semi_manufactured" ? "semi_manufactured" : "received";
        await db.update(products)
          .set({ status: newStatus, statusChangedAt: new Date(), quantity: receivedQty })
          .where(eq(products.id, item.productId));

        if (item.parts && Array.isArray(item.parts) && prod.status === "semi_manufactured") {
          await db.delete(productParts).where(eq(productParts.productId, item.productId));
          for (const part of item.parts) {
            if (!part.name) continue;
            await db.insert(productParts).values({
              productId: item.productId,
              name: part.name,
              quantity: part.quantity || 0,
              length: part.length || null,
              width: part.width || null,
              height: part.height || null,
              weight: part.weight || null,
              piecesPerCarton: part.piecesPerCarton || null,
            });
          }
        }
      }
    }

    return delivery;
  }

  async getDeliveries(): Promise<any[]> {
    const allDeliveries = await db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
    const result = [];
    for (const del of allDeliveries) {
      const sup = await db.select().from(suppliers).where(eq(suppliers.id, del.supplierId));
      const wh = await db.select().from(warehouses).where(eq(warehouses.id, del.warehouseId));
      const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, del.id));
      const enrichedItems = [];
      for (const item of items) {
        const prods = await db.select().from(products).where(eq(products.id, item.productId));
        enrichedItems.push({
          ...item,
          productName: prods[0]?.name || `منتج #${item.productId}`,
          productNameZh: prods[0]?.nameZh || null,
        });
      }
      result.push({
        ...del,
        supplierName: sup[0]?.name || "",
        warehouseName: wh[0]?.name || "",
        items: enrichedItems,
      });
    }
    return result;
  }

  async getContainers(): Promise<any[]> {
    const allContainers = await db.select().from(containers);
    const result = [];
    for (const cont of allContainers) {
      const wh = cont.warehouseId ? await db.select().from(warehouses).where(eq(warehouses.id, cont.warehouseId)) : [];
      const sc = cont.shippingCompanyId ? await db.select().from(shippingCompanies).where(eq(shippingCompanies.id, cont.shippingCompanyId)) : [];
      const cItems = await db.select().from(containerItems).where(eq(containerItems.containerId, cont.id));
      const enrichedItems = [];
      for (const item of cItems) {
        const prods = await db.select().from(products).where(eq(products.id, item.productId));
        enrichedItems.push({
          ...item,
          productName: prods[0]?.name || `منتج #${item.productId}`,
          productNameZh: prods[0]?.nameZh || null,
        });
      }
      result.push({
        ...cont,
        warehouseName: wh[0]?.name || "",
        shippingCompanyName: sc[0]?.name || cont.shippingCompany || "",
        items: enrichedItems,
      });
    }
    return result;
  }

  async createContainer(data: any, items: any[]): Promise<Container> {
    const [container] = await db.insert(containers).values({
      invoiceNumber: data.invoiceNumber,
      containerNumber: data.containerNumber,
      shippingCompany: data.shippingCompany,
      shippingCompanyId: data.shippingCompanyId || null,
      priceCNY: data.priceCNY || 0,
      priceUSD: data.priceUSD || 0,
      warehouseId: data.warehouseId,
      status: "shipping",
    }).returning();

    for (const item of items) {
      const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
      if (!prod || (prod.status !== "received" && prod.status !== "semi_manufactured")) continue;

      const shippedQty = item.quantity || prod.quantity;
      const remaining = (prod.quantity || 0) - shippedQty;

      await db.insert(containerItems).values({
        containerId: container.id,
        productId: item.productId,
        quantity: shippedQty,
      });

      await db.update(products)
        .set({ status: "shipping", statusChangedAt: new Date(), quantity: shippedQty })
        .where(eq(products.id, item.productId));

      if (remaining > 0) {
        const [newProd] = await db.insert(products).values({
          name: prod.name,
          quantity: remaining,
          categoryId: prod.categoryId,
          status: prod.status as any,
          statusChangedAt: new Date(),
        }).returning();

        if (prod.status === "semi_manufactured") {
          const existingParts = await db.select().from(productParts).where(eq(productParts.productId, item.productId));
          for (const part of existingParts) {
            await db.insert(productParts).values({
              productId: newProd.id,
              name: part.name,
              quantity: part.quantity,
              length: part.length,
              width: part.width,
              height: part.height,
              weight: part.weight,
              piecesPerCarton: part.piecesPerCarton,
            });
          }
        }
      }
    }

    const docInvoiceNumber = container.invoiceNumber || container.containerNumber || String(container.id);

    const existingDoc = await db.select().from(containerDocuments)
      .where(eq(containerDocuments.invoiceNumber, docInvoiceNumber));

    if (existingDoc.length > 0 && container.invoiceNumber) {
      const groupId = existingDoc[0].groupInvoiceId || existingDoc[0].id;
      if (!existingDoc[0].groupInvoiceId) {
        await db.update(containerDocuments)
          .set({ groupInvoiceId: existingDoc[0].id })
          .where(eq(containerDocuments.id, existingDoc[0].id));
      }
      await db.insert(containerDocuments).values({
        containerId: container.id,
        invoiceNumber: docInvoiceNumber,
        invoiceDate: new Date(),
        groupInvoiceId: groupId,
      });
    } else {
      await db.insert(containerDocuments).values({
        containerId: container.id,
        invoiceNumber: docInvoiceNumber,
        invoiceDate: new Date(),
      });
    }

    return container;
  }

  async updateContainer(id: number, data: any): Promise<Container | undefined> {
    const updateData: any = {};
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
    if (data.containerNumber !== undefined) updateData.containerNumber = data.containerNumber;
    if (data.shippingCompanyId !== undefined) updateData.shippingCompanyId = data.shippingCompanyId;
    if (data.shippingCompany !== undefined) updateData.shippingCompany = data.shippingCompany;
    if (data.priceCNY !== undefined) updateData.priceCNY = data.priceCNY;
    if (data.priceUSD !== undefined) updateData.priceUSD = data.priceUSD;

    const [container] = await db.update(containers)
      .set(updateData)
      .where(eq(containers.id, id))
      .returning();
    return container;
  }

  async markContainerArrived(containerId: number): Promise<Container | undefined> {
    const [container] = await db.update(containers)
      .set({ status: "arrived" })
      .where(eq(containers.id, containerId))
      .returning();

    const cItems = await db.select().from(containerItems).where(eq(containerItems.containerId, containerId));
    for (const item of cItems) {
      await db.update(products)
        .set({ status: "arrived", statusChangedAt: new Date() })
        .where(eq(products.id, item.productId));
    }

    return container;
  }

  async getSupplierAccount(supplierId: number): Promise<any> {
    const allDeliveries = await db.select().from(deliveries)
      .where(eq(deliveries.supplierId, supplierId))
      .orderBy(deliveries.createdAt);

    let totalCNY = 0;
    let totalUSD = 0;

    const groupedDeliveries = [];

    for (const del of allDeliveries) {
      const items = await db.select().from(deliveryItems)
        .where(eq(deliveryItems.deliveryId, del.id));
      const enrichedItems = [];
      let deliveryCNY = 0;
      let deliveryUSD = 0;
      for (const item of items) {
        const prods = await db.select().from(products).where(eq(products.id, item.productId));
        const enriched = {
          ...item,
          productName: prods[0]?.name || `منتج #${item.productId}`,
          productNameZh: prods[0]?.nameZh || null,
        };
        enrichedItems.push(enriched);
        if (item.currency === "CNY") { totalCNY += (item.price || 0) * item.quantity; deliveryCNY += (item.price || 0) * item.quantity; }
        else { totalUSD += (item.price || 0) * item.quantity; deliveryUSD += (item.price || 0) * item.quantity; }
      }
      if (enrichedItems.length > 0) {
        groupedDeliveries.push({
          id: del.id,
          createdAt: del.createdAt,
          orderId: del.orderId,
          totalCNY: deliveryCNY,
          totalUSD: deliveryUSD,
          items: enrichedItems,
        });
      }
    }

    const allPayments = await db.select().from(payments)
      .where(eq(payments.supplierId, supplierId));

    let paidCNY = 0;
    let paidUSD = 0;
    for (const p of allPayments) {
      if (p.currency === "CNY") paidCNY += p.amount;
      else paidUSD += p.amount;
    }

    return {
      totalCNY,
      totalUSD,
      paidCNY,
      paidUSD,
      deliveries: groupedDeliveries,
      payments: allPayments,
    };
  }


  async getAnnualInventory(year: number): Promise<any> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // All products + categories
    const allProducts = await db.select().from(products);
    const allCategories = await db.select().from(categories);
    const catMap: Record<number, string> = {};
    for (const cat of allCategories) catMap[cat.id] = cat.name;

    // Deliveries this year
    const yearDeliveries = await db.select().from(deliveries)
      .where(and(sql`${deliveries.createdAt} >= ${startISO}::timestamp`, sql`${deliveries.createdAt} < ${endISO}::timestamp`));

    // Delivery items aggregated by product
    const deliveredByProduct: Record<number, number> = {};
    for (const del of yearDeliveries) {
      const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, del.id));
      for (const item of items) {
        deliveredByProduct[item.productId] = (deliveredByProduct[item.productId] || 0) + item.quantity;
      }
    }

    // Containers this year
    const yearContainers = await db.select().from(containers)
      .where(and(sql`${containers.createdAt} >= ${startISO}::timestamp`, sql`${containers.createdAt} < ${endISO}::timestamp`));

    // Container items aggregated by product
    const shippedByProduct: Record<number, number> = {};
    for (const cont of yearContainers) {
      const items = await db.select().from(containerItems).where(eq(containerItems.containerId, cont.id));
      for (const item of items) {
        shippedByProduct[item.productId] = (shippedByProduct[item.productId] || 0) + item.quantity;
      }
    }

    // Product summary (only products with any activity)
    const productSummary = allProducts
      .map(p => ({
        id: p.id,
        name: p.name,
        categoryName: p.categoryId ? (catMap[p.categoryId] || null) : null,
        deliveredQty: deliveredByProduct[p.id] || 0,
        shippedQty: shippedByProduct[p.id] || 0,
        currentStock: p.quantity,
      }))
      .filter(p => p.deliveredQty > 0 || p.shippedQty > 0 || p.currentStock > 0);

    // Supplier summary
    const allSuppliers = await db.select().from(suppliers);
    const supplierSummary = [];

    for (const sup of allSuppliers) {
      // This year deliveries for this supplier
      const supYearDeliveries = yearDeliveries.filter(d => d.supplierId === sup.id);
      let deliveredYearCNY = 0, deliveredYearUSD = 0;
      for (const del of supYearDeliveries) {
        const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, del.id));
        for (const item of items) {
          if (item.currency === "CNY") deliveredYearCNY += (item.price || 0) * item.quantity;
          else deliveredYearUSD += (item.price || 0) * item.quantity;
        }
      }

      // This year payments for this supplier
      const yearPays = await db.select().from(payments)
        .where(and(eq(payments.supplierId, sup.id), sql`${payments.createdAt} >= ${startISO}::timestamp`, sql`${payments.createdAt} < ${endISO}::timestamp`));
      let paidYearCNY = 0, paidYearUSD = 0;
      for (const p of yearPays) {
        if (p.currency === "CNY") paidYearCNY += p.amount;
        else paidYearUSD += p.amount;
      }

      // All-time totals for balance
      const allSupDeliveries = await db.select().from(deliveries).where(eq(deliveries.supplierId, sup.id));
      let totalDelivCNY = 0, totalDelivUSD = 0;
      for (const del of allSupDeliveries) {
        const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, del.id));
        for (const item of items) {
          if (item.currency === "CNY") totalDelivCNY += (item.price || 0) * item.quantity;
          else totalDelivUSD += (item.price || 0) * item.quantity;
        }
      }
      const allSupPays = await db.select().from(payments).where(eq(payments.supplierId, sup.id));
      let totalPaidCNY = 0, totalPaidUSD = 0;
      for (const p of allSupPays) {
        if (p.currency === "CNY") totalPaidCNY += p.amount;
        else totalPaidUSD += p.amount;
      }

      // Only include suppliers that have any deliveries ever
      if (totalDelivCNY > 0 || totalDelivUSD > 0 || supYearDeliveries.length > 0) {
        supplierSummary.push({
          id: sup.id,
          name: sup.name,
          deliveryCountYear: supYearDeliveries.length,
          deliveredYearCNY,
          deliveredYearUSD,
          paidYearCNY,
          paidYearUSD,
          totalDelivCNY,
          totalDelivUSD,
          totalPaidCNY,
          totalPaidUSD,
          balanceCNY: totalDelivCNY - totalPaidCNY,
          balanceUSD: totalDelivUSD - totalPaidUSD,
        });
      }
    }

    // Financial summary for the year
    const allYearPays = await db.select().from(payments)
      .where(and(sql`${payments.createdAt} >= ${startISO}::timestamp`, sql`${payments.createdAt} < ${endISO}::timestamp`));
    let supPayCNY = 0, supPayUSD = 0;
    for (const p of allYearPays) {
      if (p.currency === "CNY") supPayCNY += p.amount; else supPayUSD += p.amount;
    }

    const allYearShipPays = await db.select().from(shippingPayments)
      .where(and(sql`${shippingPayments.createdAt} >= ${startISO}::timestamp`, sql`${shippingPayments.createdAt} < ${endISO}::timestamp`));
    let shipPayCNY = 0, shipPayUSD = 0;
    for (const p of allYearShipPays) {
      if (p.currency === "CNY") shipPayCNY += p.amount; else shipPayUSD += p.amount;
    }

    const allYearExp = await db.select().from(expenses)
      .where(and(sql`${expenses.createdAt} >= ${startISO}::timestamp`, sql`${expenses.createdAt} < ${endISO}::timestamp`));
    let expCNY = 0, expUSD = 0;
    for (const e of allYearExp) {
      if (e.currency === "CNY") expCNY += e.amount; else expUSD += e.amount;
    }

    const allYearCashbox = await db.select().from(cashboxTransactions)
      .where(and(sql`${cashboxTransactions.createdAt} >= ${startISO}::timestamp`, sql`${cashboxTransactions.createdAt} < ${endISO}::timestamp`));
    let cashInCNY = 0, cashInUSD = 0, cashOutCNY = 0, cashOutUSD = 0;
    for (const t of allYearCashbox) {
      if (t.type === "income") {
        if (t.currency === "CNY") cashInCNY += t.amount; else cashInUSD += t.amount;
      } else {
        if (t.currency === "CNY") cashOutCNY += t.amount; else cashOutUSD += t.amount;
      }
    }

    return {
      year,
      productSummary,
      supplierSummary,
      financialSummary: {
        supplierPaymentsCNY: supPayCNY,
        supplierPaymentsUSD: supPayUSD,
        shippingPaymentsCNY: shipPayCNY,
        shippingPaymentsUSD: shipPayUSD,
        expensesCNY: expCNY,
        expensesUSD: expUSD,
        cashboxIncomeCNY: cashInCNY,
        cashboxIncomeUSD: cashInUSD,
        cashboxExpenseCNY: cashOutCNY,
        cashboxExpenseUSD: cashOutUSD,
      },
    };
  }


  async deleteOrder(id: number): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));
  }

  async deleteOrderItem(id: number): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.id, id));
  }

  async deleteDelivery(id: number): Promise<void> {
    const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, id));
    for (const item of items) {
      const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
      if (prod) {
        const newQty = Math.max(0, (prod.quantity || 0) - (item.quantity || 0));
        await db.update(products).set({ quantity: newQty }).where(eq(products.id, item.productId));
      }
    }
    await db.delete(deliveryItems).where(eq(deliveryItems.deliveryId, id));
    await db.delete(deliveries).where(eq(deliveries.id, id));
  }

  async updateDeliveryItem(id: number, data: any): Promise<any> {
    const [existing] = await db.select().from(deliveryItems).where(eq(deliveryItems.id, id));
    if (!existing) return null;
    const updateData: any = {};
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity;
      const qtyDiff = data.quantity - existing.quantity;
      const [prod] = await db.select().from(products).where(eq(products.id, existing.productId));
      if (prod) {
        const newQty = Math.max(0, (prod.quantity || 0) + qtyDiff);
        await db.update(products).set({ quantity: newQty }).where(eq(products.id, existing.productId));
      }
    }
    const [updated] = await db.update(deliveryItems).set(updateData).where(eq(deliveryItems.id, id)).returning();
    return updated;
  }

  async deleteContainer(id: number): Promise<void> {
    const items = await db.select().from(containerItems).where(eq(containerItems.containerId, id));
    for (const item of items) {
      const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
      if (prod) {
        const newQty = (prod.quantity || 0) + (item.quantity || 0);
        await db.update(products).set({ quantity: newQty, status: "received", statusChangedAt: new Date() }).where(eq(products.id, item.productId));
      }
    }
    await db.delete(containerItems).where(eq(containerItems.containerId, id));
    await db.delete(containerDocuments).where(eq(containerDocuments.containerId, id));
    await db.delete(containers).where(eq(containers.id, id));
  }

  async updateContainerItem(id: number, newQty: number): Promise<any> {
    const [item] = await db.select().from(containerItems).where(eq(containerItems.id, id));
    if (!item) return null;
    const diff = newQty - item.quantity;
    const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
    if (prod) {
      const newProdQty = (prod.quantity || 0) - diff;
      await db.update(products).set({ quantity: Math.max(0, newProdQty) }).where(eq(products.id, item.productId));
    }
    const [updated] = await db.update(containerItems).set({ quantity: newQty }).where(eq(containerItems.id, id)).returning();
    return updated;
  }

  async deleteContainerItem(id: number): Promise<void> {
    const [item] = await db.select().from(containerItems).where(eq(containerItems.id, id));
    if (!item) return;
    const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
    if (prod) {
      const newQty = (prod.quantity || 0) + (item.quantity || 0);
      await db.update(products).set({ quantity: newQty, status: "received", statusChangedAt: new Date() }).where(eq(products.id, item.productId));
    }
    await db.delete(containerItems).where(eq(containerItems.id, id));
  }

  async getShippingCompanyAccount(companyId: number): Promise<any> {
    const companyContainers = await db.select().from(containers)
      .where(eq(containers.shippingCompanyId, companyId));

    let totalCNY = 0;
    let totalUSD = 0;
    const containersList = [];

    for (const cont of companyContainers) {
      totalCNY += cont.priceCNY || 0;
      totalUSD += cont.priceUSD || 0;
      const cItems = await db.select().from(containerItems).where(eq(containerItems.containerId, cont.id));
      const enrichedItems = [];
      for (const item of cItems) {
        const prods = await db.select().from(products).where(eq(products.id, item.productId));
        enrichedItems.push({
          ...item,
          productName: prods[0]?.name || `منتج #${item.productId}`,
          productNameZh: prods[0]?.nameZh || null,
        });
      }
      containersList.push({
        ...cont,
        items: enrichedItems,
      });
    }

    const allPayments = await db.select().from(shippingPayments)
      .where(eq(shippingPayments.shippingCompanyId, companyId));

    let paidCNY = 0;
    let paidUSD = 0;
    for (const p of allPayments) {
      if (p.currency === "CNY") paidCNY += p.amount;
      else paidUSD += p.amount;
    }

    return {
      totalCNY,
      totalUSD,
      paidCNY,
      paidUSD,
      containers: containersList,
      payments: allPayments,
    };
  }

  async getDashboardSummary(): Promise<any> {
    const allCashbox = await db.select().from(cashboxTransactions);
    let cashboxIncomeCNY = 0, cashboxIncomeUSD = 0;
    let cashboxExpenseCNY = 0, cashboxExpenseUSD = 0;
    for (const tx of allCashbox) {
      if (tx.type === "income") {
        if (tx.currency === "CNY") cashboxIncomeCNY += tx.amount;
        else cashboxIncomeUSD += tx.amount;
      } else {
        if (tx.currency === "CNY") cashboxExpenseCNY += tx.amount;
        else cashboxExpenseUSD += tx.amount;
      }
    }
    const cashboxBalanceCNY = cashboxIncomeCNY - cashboxExpenseCNY;
    const cashboxBalanceUSD = cashboxIncomeUSD - cashboxExpenseUSD;

    const allSuppliers = await db.select().from(suppliers);
    let supplierDebtCNY = 0, supplierDebtUSD = 0;
    for (const sup of allSuppliers) {
      const supDeliveries = await db.select().from(deliveries).where(eq(deliveries.supplierId, sup.id));
      let totalCNY = 0, totalUSD = 0;
      for (const del of supDeliveries) {
        const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, del.id));
        for (const item of items) {
          if (item.currency === "CNY") totalCNY += (item.price || 0) * item.quantity;
          else totalUSD += (item.price || 0) * item.quantity;
        }
      }
      const supPayments = await db.select().from(payments).where(eq(payments.supplierId, sup.id));
      let paidCNY = 0, paidUSD = 0;
      for (const p of supPayments) {
        if (p.currency === "CNY") paidCNY += p.amount;
        else paidUSD += p.amount;
      }
      supplierDebtCNY += totalCNY - paidCNY;
      supplierDebtUSD += totalUSD - paidUSD;
    }

    const allShippingCompanies = await db.select().from(shippingCompanies);
    let shippingDebtCNY = 0, shippingDebtUSD = 0;
    for (const sc of allShippingCompanies) {
      const scContainers = await db.select().from(containers).where(eq(containers.shippingCompanyId, sc.id));
      let totalCNY = 0, totalUSD = 0;
      for (const cont of scContainers) {
        totalCNY += cont.priceCNY || 0;
        totalUSD += cont.priceUSD || 0;
      }
      const scPayments = await db.select().from(shippingPayments).where(eq(shippingPayments.shippingCompanyId, sc.id));
      let paidCNY = 0, paidUSD = 0;
      for (const p of scPayments) {
        if (p.currency === "CNY") paidCNY += p.amount;
        else paidUSD += p.amount;
      }
      shippingDebtCNY += totalCNY - paidCNY;
      shippingDebtUSD += totalUSD - paidUSD;
    }

    const allProducts = await db.select().from(products);
    const warehouseProductIds = allProducts
      .filter(p => p.status === "received" || p.status === "semi_manufactured")
      .map(p => p.id);

    let warehouseValueCNY = 0, warehouseValueUSD = 0;
    if (warehouseProductIds.length > 0) {
      const allDeliveryItems = await db.select().from(deliveryItems);
      for (const item of allDeliveryItems) {
        if (warehouseProductIds.includes(item.productId)) {
          if (item.currency === "CNY") warehouseValueCNY += (item.price || 0) * item.quantity;
          else warehouseValueUSD += (item.price || 0) * item.quantity;
        }
      }
    }

    const shippingContainers = await db.select().from(containers).where(eq(containers.status, "shipping"));
    let containerValueCNY = 0, containerValueUSD = 0;
    for (const cont of shippingContainers) {
      const cItems = await db.select().from(containerItems).where(eq(containerItems.containerId, cont.id));
      for (const ci of cItems) {
        const productDIs = await db.select().from(deliveryItems).where(eq(deliveryItems.productId, ci.productId));
        let totalQty = 0, weightedCNY = 0, weightedUSD = 0;
        for (const di of productDIs) {
          if (di.currency === "CNY") weightedCNY += (di.price || 0) * di.quantity;
          else weightedUSD += (di.price || 0) * di.quantity;
          totalQty += di.quantity;
        }
        if (totalQty > 0) {
          const avgPriceCNY = weightedCNY / totalQty;
          const avgPriceUSD = weightedUSD / totalQty;
          containerValueCNY += avgPriceCNY * ci.quantity;
          containerValueUSD += avgPriceUSD * ci.quantity;
        }
      }
    }

    return {
      cashbox: { balanceCNY: cashboxBalanceCNY, balanceUSD: cashboxBalanceUSD },
      supplierDebt: { CNY: supplierDebtCNY, USD: supplierDebtUSD },
      shippingDebt: { CNY: shippingDebtCNY, USD: shippingDebtUSD },
      warehouseValue: { CNY: warehouseValueCNY, USD: warehouseValueUSD },
      containerValue: { CNY: containerValueCNY, USD: containerValueUSD },
      grandTotal: {
        CNY: cashboxBalanceCNY + warehouseValueCNY + containerValueCNY - supplierDebtCNY - shippingDebtCNY,
        USD: cashboxBalanceUSD + warehouseValueUSD + containerValueUSD - supplierDebtUSD - shippingDebtUSD,
      },
    };
  }

  async createPayment(data: InsertPayment): Promise<Payment> {
    const [pay] = await db.insert(payments).values(data).returning();
    return pay;
  }

  async updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return updated;
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  async createShippingPayment(data: InsertShippingPayment): Promise<ShippingPayment> {
    const [pay] = await db.insert(shippingPayments).values(data).returning();
    return pay;
  }

  async updateShippingPayment(id: number, data: Partial<InsertShippingPayment>): Promise<ShippingPayment | undefined> {
    const [updated] = await db.update(shippingPayments).set(data).where(eq(shippingPayments.id, id)).returning();
    return updated;
  }

  async deleteShippingPayment(id: number): Promise<void> {
    await db.delete(shippingPayments).where(eq(shippingPayments.id, id));
  }

  async getProductParts(productId: number): Promise<ProductPart[]> {
    return db.select().from(productParts).where(eq(productParts.productId, productId));
  }

  async createProductPart(data: InsertProductPart): Promise<ProductPart> {
    const [part] = await db.insert(productParts).values(data).returning();
    return part;
  }

  async deleteProductPart(id: number): Promise<void> {
    await db.delete(productParts).where(eq(productParts.id, id));
  }

  async getWarehouseInventory(): Promise<any[]> {
    const receivedProducts = await db.select().from(products)
      .where(sql`${products.status} IN ('received', 'semi_manufactured')`);

    const result = [];
    for (const prod of receivedProducts) {
      const delItems = await db.select().from(deliveryItems)
        .where(eq(deliveryItems.productId, prod.id));

      const latestDelivery = delItems.length > 0 ? delItems[delItems.length - 1] : null;
      const cat = prod.categoryId ? await db.select().from(categories).where(eq(categories.id, prod.categoryId)) : [];

      let parts: ProductPart[] = [];
      if (prod.status === "semi_manufactured") {
        parts = await db.select().from(productParts).where(eq(productParts.productId, prod.id));
      }

      result.push({
        ...prod,
        categoryName: cat[0]?.name || "",
        length: latestDelivery?.length || 0,
        width: latestDelivery?.width || 0,
        height: latestDelivery?.height || 0,
        weight: latestDelivery?.weight || 0,
        piecesPerCarton: latestDelivery?.piecesPerCarton || 0,
        parts,
      });
    }
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<{ username: string; password: string; displayName: string }>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUserCategories(userId: number): Promise<number[]> {
    const rows = await db.select().from(userCategories).where(eq(userCategories.userId, userId));
    return rows.map(r => r.categoryId);
  }

  async setUserCategories(userId: number, categoryIds: number[]): Promise<void> {
    await db.delete(userCategories).where(eq(userCategories.userId, userId));
    if (categoryIds.length > 0) {
      await db.insert(userCategories).values(
        categoryIds.map(categoryId => ({ userId, categoryId }))
      );
    }
  }

  async getCashboxTransactions(): Promise<any[]> {
    const txns = await db.select().from(cashboxTransactions);
    const result = [];
    for (const txn of txns) {
      let entityName = "";
      if (txn.category === "supplier" && txn.supplierId) {
        const [sup] = await db.select().from(suppliers).where(eq(suppliers.id, txn.supplierId));
        entityName = sup?.name || "";
      } else if (txn.category === "shipping" && txn.shippingCompanyId) {
        const [sc] = await db.select().from(shippingCompanies).where(eq(shippingCompanies.id, txn.shippingCompanyId));
        entityName = sc?.name || "";
      } else if (txn.category === "expense" && txn.expenseId) {
        const [exp] = await db.select().from(expenses).where(eq(expenses.id, txn.expenseId));
        entityName = exp?.title || "";
      }
      result.push({ ...txn, entityName });
    }
    return result;
  }

  async getCashboxSummary(): Promise<any> {
    const txns = await db.select().from(cashboxTransactions);
    let incomeCNY = 0, incomeUSD = 0, expenseCNY = 0, expenseUSD = 0;
    for (const txn of txns) {
      if (txn.type === "income") {
        if (txn.currency === "CNY") incomeCNY += txn.amount;
        else incomeUSD += txn.amount;
      } else {
        if (txn.currency === "CNY") expenseCNY += txn.amount;
        else expenseUSD += txn.amount;
      }
    }
    return {
      incomeCNY, incomeUSD,
      expenseCNY, expenseUSD,
      balanceCNY: incomeCNY - expenseCNY,
      balanceUSD: incomeUSD - expenseUSD,
    };
  }

  async createCashboxTransaction(data: InsertCashboxTransaction): Promise<CashboxTransaction> {
    const [txn] = await db.insert(cashboxTransactions).values(data).returning();
    return txn;
  }

  async updateCashboxTransaction(id: number, data: Partial<InsertCashboxTransaction>): Promise<CashboxTransaction | undefined> {
    const [updated] = await db.update(cashboxTransactions).set(data).where(eq(cashboxTransactions.id, id)).returning();
    return updated;
  }

  async deleteCashboxTransaction(id: number): Promise<void> {
    await db.delete(cashboxTransactions).where(eq(cashboxTransactions.id, id));
  }

  async getCashboxByPaymentId(paymentId: number): Promise<CashboxTransaction | undefined> {
    const [txn] = await db.select().from(cashboxTransactions).where(eq(cashboxTransactions.paymentId, paymentId));
    return txn;
  }

  async getCashboxByShippingPaymentId(shippingPaymentId: number): Promise<CashboxTransaction | undefined> {
    const [txn] = await db.select().from(cashboxTransactions).where(eq(cashboxTransactions.shippingPaymentId, shippingPaymentId));
    return txn;
  }

  async deleteCashboxByPaymentId(paymentId: number): Promise<void> {
    await db.delete(cashboxTransactions).where(eq(cashboxTransactions.paymentId, paymentId));
  }

  async deleteCashboxByShippingPaymentId(shippingPaymentId: number): Promise<void> {
    await db.delete(cashboxTransactions).where(eq(cashboxTransactions.shippingPaymentId, shippingPaymentId));
  }

  async updateCashboxByPaymentId(paymentId: number, data: Partial<InsertCashboxTransaction>): Promise<CashboxTransaction | undefined> {
    const [updated] = await db.update(cashboxTransactions).set(data).where(eq(cashboxTransactions.paymentId, paymentId)).returning();
    return updated;
  }

  async updateCashboxByShippingPaymentId(shippingPaymentId: number, data: Partial<InsertCashboxTransaction>): Promise<CashboxTransaction | undefined> {
    const [updated] = await db.update(cashboxTransactions).set(data).where(eq(cashboxTransactions.shippingPaymentId, shippingPaymentId)).returning();
    return updated;
  }

  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses);
  }

  async createExpense(data: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(data).returning();
    return expense;
  }

  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getCashboxByExpenseId(expenseId: number): Promise<CashboxTransaction | undefined> {
    const [txn] = await db.select().from(cashboxTransactions).where(eq(cashboxTransactions.expenseId, expenseId));
    return txn;
  }

  async deleteCashboxByExpenseId(expenseId: number): Promise<void> {
    await db.delete(cashboxTransactions).where(eq(cashboxTransactions.expenseId, expenseId));
  }

  async updateCashboxByExpenseId(expenseId: number, data: Partial<InsertCashboxTransaction>): Promise<CashboxTransaction | undefined> {
    const [updated] = await db.update(cashboxTransactions).set(data).where(eq(cashboxTransactions.expenseId, expenseId)).returning();
    return updated;
  }

  async getContainerDocuments(): Promise<any[]> {
    const docs = await db.select().from(containerDocuments).orderBy(desc(containerDocuments.id));
    const result = [];
    for (const doc of docs) {
      const [container] = await db.select().from(containers).where(eq(containers.id, doc.containerId));
      result.push({ ...doc, container });
    }
    return result;
  }

  async getContainerDocument(id: number): Promise<any> {
    const [doc] = await db.select().from(containerDocuments).where(eq(containerDocuments.id, id));
    return doc;
  }

  async updateContainerDocument(id: number, data: any): Promise<any> {
    const [updated] = await db.update(containerDocuments).set(data).where(eq(containerDocuments.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();