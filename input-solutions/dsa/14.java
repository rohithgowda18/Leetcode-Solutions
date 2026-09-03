class Solution {
    public String longestCommonPrefix(String[] strs) {
        String prefix = "";
        for(int i=0;i<strs[0].length();i++){
            String temp = strs[0].substring(0,i+1);
            int j=0;
            for(j=1;j<strs.length;j++){
                if(strs[j].length()< i+1 || !strs[j].substring(0,i+1).equals(temp)){
                    break;
                }
            }
            if (j == strs.length) {
                prefix = temp;
            } else {
                break;
            }

        }

        return prefix;
    }
}
