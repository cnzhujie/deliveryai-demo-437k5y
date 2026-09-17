import { test, expect, type Page } from '@playwright/test'

/** Navigate from app start to the menu view (bind table → enter menu). */
async function goToMenu(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /A08/ }).first().click()
  await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
}

test.describe('首页第一屏推荐菜展示 - E2E 验收测试', () => {
  test('REQ-001.1 & REQ-001.2: 推荐菜区域在 Hero Banner 下方、搜索栏上方展示，标题和卡片内容正确', async ({ page }) => {
    await goToMenu(page)

    // 推荐区标题可见
    const recommendTitle = page.getByRole('heading', { name: '今日推荐' })
    await expect(recommendTitle).toBeVisible()

    // 推荐区标题在搜索栏之前（DOM 顺序）
    const titleBox = await recommendTitle.boundingBox()
    const searchInput = page.getByPlaceholder(/搜索/)
    const searchBox = await searchInput.boundingBox()
    expect(titleBox && searchBox).toBeTruthy()
    expect(titleBox!.y).toBeLessThan(searchBox!.y)

    // 推荐区有 5 道推荐菜（p1/p3/p5/p7/p9）
    const recommendCards = recommendTitle.locator('+ div').locator('button')
    await expect(recommendCards).toHaveCount(5)

    // 第一张推荐菜（p1 鎏金番茄鸳鸯锅 ¥68）名称和价格可见
    await expect(recommendCards.nth(0).getByText('鎏金番茄鸳鸯锅')).toBeVisible()
    await expect(recommendCards.nth(0).getByText('¥68')).toBeVisible()

    // p1 有 badge（人气 No.1）
    await expect(recommendCards.nth(0).getByText('人气 No.1')).toBeVisible()

    // p3 琥珀嫩牛肉 ¥42
    await expect(recommendCards.nth(1).getByText('琥珀嫩牛肉')).toBeVisible()
    await expect(recommendCards.nth(1).getByText('¥42')).toBeVisible()

    // p9 手工宽粉 ¥16（最后一道）
    await expect(recommendCards.nth(4).getByText('手工宽粉')).toBeVisible()
    await expect(recommendCards.nth(4).getByText('¥16')).toBeVisible()

    // p7 田园蔬菜拼盘无 badge
    await expect(recommendCards.nth(3).getByText('田园蔬菜拼盘')).toBeVisible()
  })

  test('REQ-001.3: 点击未售罄的推荐菜卡片打开规格选择弹窗', async ({ page }) => {
    await goToMenu(page)

    const recommendTitle = page.getByRole('heading', { name: '今日推荐' })
    const recommendCards = recommendTitle.locator('+ div').locator('button')

    // 点击第一张推荐菜（p1 鎏金番茄鸳鸯锅）
    await recommendCards.nth(0).click()

    // 规格选择弹窗打开，标题为菜品名（Dialog title 渲染为 h2）
    await expect(page.getByRole('heading', { level: 2, name: '鎏金番茄鸳鸯锅' })).toBeVisible()

    // 弹窗包含规格选项（辣度等）和加购按钮
    await expect(page.getByText('选择辣度')).toBeVisible()
    await expect(page.getByRole('button', { name: /加入本桌购物车/ })).toBeVisible()

    // 选择辣度并加购
    await page.getByRole('button', { name: '中辣' }).click()
    await page.getByRole('button', { name: /加入本桌购物车/ }).click()

    // 弹窗关闭：规格选项不再可见
    await expect(page.getByText('选择辣度')).not.toBeVisible()
    // 购物车中出现该菜品
    await expect(page.getByText('本桌购物车').first()).toBeVisible()
    await expect(page.getByText('鎏金番茄鸳鸯锅').first()).toBeVisible()
  })

  test('REQ-001.5: 推荐菜区域不受分类切换和搜索筛选影响', async ({ page }) => {
    await goToMenu(page)

    const recommendTitle = page.getByRole('heading', { name: '今日推荐' })
    const recommendCards = recommendTitle.locator('+ div').locator('button')

    // 切换到"牛羊肉"分类
    await page.getByRole('button', { name: '牛羊肉' }).click()
    // 推荐区仍然可见且有 5 张卡片
    await expect(recommendTitle).toBeVisible()
    await expect(recommendCards).toHaveCount(5)

    // 在搜索框输入关键词
    const searchInput = page.getByPlaceholder(/搜索/)
    await searchInput.fill('毛肚')

    // 推荐区仍然可见且有 5 张卡片
    await expect(recommendTitle).toBeVisible()
    await expect(recommendCards).toHaveCount(5)

    // 清空搜索后推荐区仍正常
    await searchInput.fill('')
    await expect(recommendCards).toHaveCount(5)
  })
})
