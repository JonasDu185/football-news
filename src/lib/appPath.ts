/** 把应用内路径拼到当前部署 base 下。开发环境仍走 Vite 代理的根路径。 */
export function appPath(path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path
  if (import.meta.env.DEV) return `/${clean}`
  return `${import.meta.env.BASE_URL}${clean}`
}
