export async function findAllJavascriptFiles(folder) {
    let result = [];
    const files = await folder.read();
  
    for (let file of files) {
      if (typeof file === 'string' && file.endsWith('.js')) {
        result.push(file);
      } else if (typeof file === 'object') {
        const nestedFiles = await findAllJavascriptFiles(file);
        result = result.concat(nestedFiles);
      }
    }
    return result;
  }

  export function Folder(files) {
    return {
      size: () => {
        return new Promise((res) => res(files.length));
      },
      read: () => {
        return new Promise((res) => res(files));
      }
    };
  }