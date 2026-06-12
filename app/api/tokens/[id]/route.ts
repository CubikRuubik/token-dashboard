import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, ctx: RouteContext<'/api/tokens/[id]'>) {
  const { id } = await ctx.params

  await prisma.token.delete({
    where: { id: Number(id) },
  })

  return new Response(null, { status: 204 })
}
