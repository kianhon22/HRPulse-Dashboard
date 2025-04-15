// export function titleCase(str: string): string {
//     return str
//       .toLowerCase()
//       .split(" ")
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(" ");
//  }

export function titleCase(str: string): string {
  return str
    .split(" ")
    .map(word => {
      const match = word.match(/^([a-zA-Z])(.+)$/);
      return match
        ? match[1].toUpperCase() + match[2]
        : word;
    })
    .join(" ");
}
  