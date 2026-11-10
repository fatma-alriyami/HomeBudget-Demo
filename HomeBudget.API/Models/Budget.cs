using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HomeBudget.API.Models
{
    public class Budget
    {
        public int Id { get; set; }

        public int ExpenseCategoryId { get; set; }

        public ExpenseCategory ExpenseCategory { get; set; } = null!;

        [Range(1, 12)]
        public int Month { get; set; } = DateTime.Today.Month;

        [Range(2000, 2100)]
        public int Year { get; set; } = DateTime.Today.Year;

        [Column(TypeName = "decimal(18,3)")]
        [Range(typeof(decimal), "0.001", "999999999999999.999")]
        public decimal Amount { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}