import { api, apiErrorResponse } from '@/lib/api'

export async function DELETE(_req: Request, ctx: RouteContext<'/api/tokens/[id]'>) {
  try {
    const { id } = await ctx.params
    await api.delete(`/tokens/${id}`)
    return new Response(null, { status: 204 })
  } catch (err) {
    return apiErrorResponse(err)
  }
}
