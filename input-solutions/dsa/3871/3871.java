class Solution {
    public long countCommas(long n) {
        if(n<1000)return 0;

        long cnt=0;
        long commas=1;
        long st=1000;
        while(st<=n){
            long end=st*1000-1;
            cnt +=(Math.min(end,n)-st+1)*commas;
            st *=1000;
            commas++;
        }

        return cnt;
    }
}
