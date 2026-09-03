class Solution {
    public String convert(String s, int numRows) {
        if(numRows==1)return s;
        int jump = (2*numRows)-2;
        StringBuilder res = new StringBuilder();
        int i=0;

        while(i<numRows){
            int j=i;
            while(j<s.length()){
                res.append(s.charAt(j));

                if(i!=0 && i!=numRows-1){
                    int diag = j+ jump-2 * i;
                    if (diag < s.length()) {
                        res.append(s.charAt(diag));
                    }
                }
                j=j+jump;
            }
            
            i++;
        }

        return res.toString();
    }
}
