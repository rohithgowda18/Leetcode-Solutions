class Solution {
    int ans=0;
    public int averageOfSubtree(TreeNode root) {
        helper(root);

        return ans;
    }
    int[] helper(TreeNode root){
        if(root==null){
            return new int[]{0,0};
        }

        int[] left =helper(root.left);
        int[] right =helper(root.right);

        int sum =left[0]+right[0]+root.val;
        int cnt =left[1]+right[1]+1;

        if(sum/cnt == root.val)ans++;

        return new int[]{sum,cnt};
    }
}
