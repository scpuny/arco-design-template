// JSX 类型声明（tsx 渲染函数菜单等）
// vue-tsc 需全局存在 JSX.IntrinsicElements，否则菜单组件报 TS7026
export {}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}