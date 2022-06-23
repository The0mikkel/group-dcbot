export default interface DBElement {
    /**
     * Save to database
     */
    save(): Promise<any>;
}