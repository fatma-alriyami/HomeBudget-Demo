using HomeBudget.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HomeBudget.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
        public DbSet<IncomeSource> IncomeSources => Set<IncomeSource>();
        public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
        public DbSet<Income> Incomes => Set<Income>();
        public DbSet<Expense> Expenses => Set<Expense>();
        public DbSet<Budget> Budgets => Set<Budget>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Income>()
                .HasOne(i => i.FamilyMember)
                .WithMany()
                .HasForeignKey(i => i.FamilyMemberId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Income>()
                .HasOne(i => i.IncomeSource)
                .WithMany()
                .HasForeignKey(i => i.IncomeSourceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Expense>()
                .HasOne(e => e.FamilyMember)
                .WithMany()
                .HasForeignKey(e => e.FamilyMemberId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Expense>()
                .HasOne(e => e.ExpenseCategory)
                .WithMany()
                .HasForeignKey(e => e.ExpenseCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Budget>()
                .HasOne(b => b.ExpenseCategory)
                .WithMany()
                .HasForeignKey(b => b.ExpenseCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Budget>()
                .HasIndex(b => new
                {
                    b.ExpenseCategoryId,
                    b.Year,
                    b.Month
                })
                .IsUnique();
        }
    }
}