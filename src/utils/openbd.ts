// OpenBD API: 国内書籍の定価をISBNで取得（無料・APIキー不要）
export async function fetchPriceByIsbn(isbn: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.[0];
    if (!item) return null;
    // ONIX 3.0 の正しいパス: ProductSupply.SupplyDetail.Price[]
    const prices: any[] = item.onix?.ProductSupply?.SupplyDetail?.Price ?? [];
    const priceInfo = prices.find((p: any) => p.PriceType === '02') ?? prices[0];
    return priceInfo?.PriceAmount ? parseInt(priceInfo.PriceAmount) : null;
  } catch {
    return null;
  }
}
