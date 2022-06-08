export default class ArrayRemover {
    public static arrayRemove(arr: string[], value: string): string[] {
        return arr.filter(function (ele) {
            return ele != value;
        });
    }
}